import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NotifyService } from '../../../../shared/services/notify.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DialogModule } from 'primeng/dialog';
import { AuthService, RegisterCustomerDTO } from '../../../../shared/services/auth.service';
import { TableSessionService } from '../../../../shared/services/table-session.service';
import { TableLobbyService } from '../../../../shared/services/table-lobby.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { CustomerSessionService } from '../../../../shared/services/customer-session.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoginDTO } from '../../../auth/login/models/loginDTO.model';
import { ScanResultDTO } from '../../../../shared/models/sessionDTO.model';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { NavigationService } from '../../../../core/services/navigation.service';
import {
    emailOrUsernameValidator,
    emailValidators,
    nameValidators,
    passwordMatchValidator,
    passwordValidators,
    usernameValidators,
} from '../../../../core/validators/auth-validators';

const SCAN_KEY = 'scanQr';
const LOGIN_KEY = 'customerLogin';
const REGISTER_KEY = 'customerRegister';
const GUEST_KEY = 'customerGuest';

@Component({
    selector: 'app-qr-landing-page',
    imports: [
        ReactiveFormsModule,
        RouterLink,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        DialogModule,
        ImageUrlPipe,
    ],
    templateUrl: './qr-landing-page.html',
    styleUrl: './qr-landing-page.scss',
})
export class QrLandingPage implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly sessionService = inject(TableSessionService);
    private readonly lobbyService = inject(TableLobbyService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly customerSession = inject(CustomerSessionService);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(NotifyService);
    private readonly destroyRef = inject(DestroyRef);
    protected readonly loadingService = inject(LoadingService);
    private readonly navigationService: NavigationService = inject(NavigationService);

    private joinedTableId: number | null = null;

    protected readonly SCAN_KEY = SCAN_KEY;
    protected readonly RESOLVE_KEY = SCAN_KEY;
    protected readonly LOGIN_KEY = LOGIN_KEY;
    protected readonly REGISTER_KEY = REGISTER_KEY;
    protected readonly GUEST_KEY = GUEST_KEY;

    protected readonly token = signal<string | null>(null);
    protected readonly scan = signal<ScanResultDTO | null>(null);
    protected readonly resolved = this.scan;
    protected readonly showLoginCta = signal(false);
    protected readonly scanError = signal<string | null>(null);
    protected readonly resolveError = this.scanError;
    protected readonly geo = signal<{ lat: number; lng: number } | null>(null);

    protected readonly hasExistingGuest = computed(() => {
        const s = this.scan();
        return !!s?.existingSession && s.existingSession.ownerKind === 'Guest';
    });

    protected readonly loginDialog = signal(false);
    protected readonly registerDialog = signal(false);

    loginForm: FormGroup = this.fb.group({
        identifier: ['', [Validators.required, emailOrUsernameValidator]],
        password: ['', passwordValidators],
    });

    registerForm: FormGroup = this.fb.group(
        {
            firstName: ['', nameValidators],
            lastName: ['', nameValidators],
            email: ['', emailValidators],
            username: ['', usernameValidators],
            password: ['', passwordValidators],
            confirmPassword: ['', [Validators.required]],
            acceptTerms: [false, Validators.requiredTrue],
        },
        { validators: [passwordMatchValidator] },
    );

    async ngOnInit(): Promise<void> {
        const token = this.route.snapshot.paramMap.get('token');
        if (!token) {
            this.scanError.set('Missing QR token.');
            return;
        }
        this.token.set(token);

        try {
            const coords = await this.getCurrentPosition();
            this.geo.set({ lat: coords.latitude, lng: coords.longitude });
        } catch (err) {
            const code = (err as GeolocationPositionError)?.code;
            this.scanError.set(
                code === 1
                    ? 'Allow location access and reload - the restaurant verifies your proximity before showing the menu.'
                    : 'Could not get your location. Please try again.',
            );
            return;
        }

        this.runScan(token);
    }

    private runScan(token: string): void {
        const g = this.geo();
        this.showLoginCta.set(false);
        this.loadingService.start(SCAN_KEY);
        this.sessionService
            .scan({
                qrToken: token,
                customerLatitude: g?.lat ?? null,
                customerLongitude: g?.lng ?? null,
            })
            .pipe(finalize(() => this.loadingService.stop(SCAN_KEY)))
            .subscribe({
                next: (res) => {
                    if (!res.isSuccess) {
                        this.scanError.set(this.formatError(res.error));
                        return;
                    }
                    const result = res.value;
                    this.scan.set(result);
                    this.customerSession.set({
                        restaurantId: result.restaurantId,
                        tableId: result.tableId,
                        tableNumber: result.tableNumber,
                        tableLabel: result.tableLabel,
                        restaurantName: result.restaurantName,
                        restaurantSlug: '',
                        restaurantLogoUrl: null,
                        currency: null,
                    });

                    this.subscribeLobby(result.tableId, token);

                    if (result.blockedByOtherUser) {
                        if (!this.authService.currentUser()) {
                            this.showLoginCta.set(true);
                            this.scanError.set(
                                'This table is in use by a signed-in guest. Log in to continue.',
                            );
                        } else {
                            this.scanError.set(
                                'This table is currently in use by another guest signed into their account. Please wait and try again.',
                            );
                        }
                        return;
                    }

                    if (result.blockedByActiveOrder) {
                        if (!this.authService.currentUser()) {
                            this.showLoginCta.set(true);
                            this.scanError.set(
                                'There is an active order by a signed-in guest at this table. Log in to view it.',
                            );
                        } else {
                            this.scanError.set(
                                'There is still an unfinished order at this table. Please wait until the staff settle it before scanning again.',
                            );
                        }
                        return;
                    }

                    if (result.joinableOrderId && !result.existingSession) {
                        this.joinStaffOrder(token, result.joinableOrderId);
                        return;
                    }

                    if (result.myActiveOrderId) {
                        this.router.navigate(['/t', token, 'order', result.myActiveOrderId]);
                        return;
                    }

                    if (result.shouldLogoutForGuestJoin) {
                        this.authService.logout().subscribe({
                            next: () => this.runScan(token),
                            error: () => this.runScan(token),
                        });
                        return;
                    }

                    if (result.existingSession && result.existingSession.ownerKind === 'Guest') {
                        this.joinAsGuest(token, result.existingSession.partySize);
                        return;
                    }

                    if (result.existingSession && result.existingSession.ownerKind === 'User' && result.isOwnerOfExisting) {
                        this.router.navigate(['/t', token, 'menu']);
                        return;
                    }

                    const role = this.authService.currentUser()?.role;
                    if (role === 'User' && !result.existingSession) {
                        this.router.navigate(['/t', token, 'party']);
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.scanError.set(this.formatError(err.error?.error));
                },
            });
    }

    private formatError(raw: string | null | undefined): string {
        if (!raw) return 'Could not scan QR code.';
        if (raw === 'LOCATION_REQUIRED')
            return 'Please allow location access - the restaurant verifies your proximity before showing the menu.';
        if (raw.startsWith('OUT_OF_RANGE:')) {
            const parts = raw.split(':');
            const distance = parts[1] ?? '?';
            const limit = parts[2] ?? '?';
            return `You are ${distance}m away. Must be within ${limit}m of the restaurant to use this QR.`;
        }
        if (raw === 'TABLE_IN_USE_BY_OTHER_USER')
            return 'This table is currently in use by another guest signed into their account.';
        if (raw === 'TABLE_HAS_GUEST_SESSION')
            return 'This table already has an active guest session. You will join it as a guest.';
        if (raw === 'TABLE_HAS_UNFINISHED_ORDER')
            return 'There is still an unfinished order at this table. Please wait until the staff settle it before scanning again.';
        if (raw === 'TABLE_OUT_OF_SERVICE')
            return 'This table is currently out of service. Please ask the staff for another table.';
        if (raw === 'TABLE_NEEDS_CLEANING')
            return 'This table is still being cleared. Please wait for the staff to finish before scanning again.';
        return raw;
    }

    private joinAsGuest(token: string, partySize: number): void {
        const g = this.geo();
        this.loadingService.start(GUEST_KEY);
        this.sessionService
            .startGuest({
                qrToken: token,
                customerLatitude: g?.lat ?? null,
                customerLongitude: g?.lng ?? null,
                asGuest: true,
                partySize,
            })
            .pipe(finalize(() => this.loadingService.stop(GUEST_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.sessionService.setSession(res.value);
                        this.customerSession.setPartySize(res.value.partySize);
                        this.router.navigate(['/t', token, 'menu']);
                    } else {
                        this.scanError.set(this.formatError(res.error));
                    }
                },
                error: (err: HttpErrorResponse) =>
                    this.scanError.set(this.formatError(err.error?.error)),
            });
    }

    private joinStaffOrder(token: string, orderId: number): void {
        const g = this.geo();
        this.loadingService.start(GUEST_KEY);
        this.sessionService
            .startGuest({
                qrToken: token,
                customerLatitude: g?.lat ?? null,
                customerLongitude: g?.lng ?? null,
                asGuest: true,
                partySize: 1,
            })
            .pipe(finalize(() => this.loadingService.stop(GUEST_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.sessionService.setSession(res.value);
                        this.customerSession.setPartySize(res.value.partySize);
                        this.router.navigate(['/t', token, 'order', orderId]);
                    } else {
                        this.scanError.set(this.formatError(res.error));
                    }
                },
                error: (err: HttpErrorResponse) =>
                    this.scanError.set(this.formatError(err.error?.error)),
            });
    }

    protected openLogin(): void {
        this.loginForm.reset({ identifier: '', password: '' });
        this.loginDialog.set(true);
    }

    protected openRegister(): void {
        this.registerForm.reset({
            firstName: '',
            lastName: '',
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
            acceptTerms: false,
        });
        this.registerDialog.set(true);
    }

    protected submitLogin(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }
        const { identifier, password } = this.loginForm.value;
        const payload: LoginDTO = { email: identifier, username: identifier, password };

        this.loadingService.start(LOGIN_KEY);
        this.authService
            .login(payload)
            .pipe(finalize(() => this.loadingService.stop(LOGIN_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.loginDialog.set(false);
                        const t = this.token();
                        if (t) this.afterAuthChoose(t);
                    } else {
                        this.toastError('Login failed');
                    }
                },
                error: (err: HttpErrorResponse) => this.toastError(err.error?.error ?? 'Login failed'),
            });
    }

    protected submitRegister(): void {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }
        const v = this.registerForm.value;
        const payload: RegisterCustomerDTO = {
            firstName: this.trimOrNull(v.firstName),
            lastName: this.trimOrNull(v.lastName),
            email: v.email.trim(),
            username: v.username.trim(),
            password: v.password,
            confirmPassword: v.confirmPassword,
        };

        this.loadingService.start(REGISTER_KEY);
        this.authService
            .registerCustomer(payload)
            .pipe(finalize(() => this.loadingService.stop(REGISTER_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.registerDialog.set(false);
                        const t = this.token();
                        const email = res.value?.email ?? payload.email;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Check your inbox',
                            detail: `We sent a 6-digit code to ${email}`,
                            life: 3000,
                        });
                        this.router.navigate(['/verify-email'], {
                            queryParams: t ? { returnUrl: `/t/${t}/party` } : undefined,
                            state: { email },
                        });
                    } else {
                        this.toastError(res.error ?? 'Registration failed');
                    }
                },
                error: (err: HttpErrorResponse) =>
                    this.toastError(err.error?.error ?? 'Registration failed'),
            });
    }

    protected continueAsGuest(): void {
        const token = this.token();
        if (!token) return;

        const s = this.scan();
        if (s?.existingSession && s.existingSession.ownerKind === 'Guest') {
            this.joinAsGuest(token, s.existingSession.partySize);
            return;
        }

        const tableId = s?.tableId;
        if (tableId) {
            this.lobbyService
                .advance(tableId, { stage: 'PartySize', qrToken: token })
                .subscribe();
        }
        this.router.navigate(['/t', token, 'party']);
    }

    private afterAuthChoose(token: string): void {
        this.runScan(token);
    }

    protected continueExistingOrder(): void {
        const token = this.token();
        const s = this.scan();
        if (!token || !s?.existingSession) return;
        this.joinAsGuest(token, s.existingSession.partySize);
    }

    protected restartSession(): void {
        const token = this.token();
        if (!token) return;

        const g = this.geo();
        this.loadingService.start(GUEST_KEY);
        this.sessionService
            .restartByQr({
                qrToken: token,
                customerLatitude: g?.lat ?? null,
                customerLongitude: g?.lng ?? null,
            })
            .pipe(finalize(() => this.loadingService.stop(GUEST_KEY)))
            .subscribe({
                next: () => this.runScan(token),
                error: (err: HttpErrorResponse) =>
                    this.scanError.set(this.formatError(err.error?.error)),
            });
    }

    private async subscribeLobby(tableId: number, token: string): Promise<void> {
        if (this.joinedTableId === tableId) return;
        this.joinedTableId = tableId;
        await this.realtime.joinTable(tableId);

        this.lobbyService.get(tableId).subscribe({
            next: (res) => {
                if (res.isSuccess && res.value) this.applyLobby(res.value, token);
            },
        });

        this.realtime.tableLobbyChanged$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                if (state.tableId !== tableId) return;
                this.applyLobby(state, token);
            });

        this.realtime.reconnected$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.lobbyService.get(tableId).subscribe({
                    next: (res) => {
                        if (res.isSuccess && res.value) this.applyLobby(res.value, token);
                    },
                });
            });
    }

    private applyLobby(state: { stage: string; orderId: number | null }, token: string): void {
        if (state.stage === 'PartySize') {
            this.router.navigate(['/t', token, 'party']);
            return;
        }

        if (state.stage === 'Tracking' && state.orderId) {
            const orderId = state.orderId;
            this.authService.guestLogin({ qrToken: token }).subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.router.navigate(['/t', token, 'order', orderId]);
                    }
                },
            });
            return;
        }

        if (state.stage === 'UserLocked') {
            const callerUserId = this.authService.currentUser()?.userId;
            const scan = this.scan();
            const existingOwner = scan?.existingSession?.ownerUserId;
            if (callerUserId && existingOwner && callerUserId === existingOwner) {
                this.router.navigate(['/t', token, 'menu']);
            } else {
                this.scanError.set(
                    'This table is currently in use by a signed-in guest. Please wait and try again.',
                );
            }
        }
    }

    async ngOnDestroy(): Promise<void> {
        if (this.joinedTableId !== null) {
            await this.realtime.leaveTable(this.joinedTableId);
            this.joinedTableId = null;
        }
    }

    private getCurrentPosition(): Promise<GeolocationCoordinates> {
        return new Promise((resolve, reject) => {
            if (!('geolocation' in navigator)) {
                reject({ code: 2, message: 'Geolocation not supported' } as GeolocationPositionError);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pos.coords),
                (err) => reject(err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
            );
        });
    }

    protected isInvalid(form: FormGroup, controlName: string): boolean {
        const control = form.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    private toastError(detail: string): void {
        this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
    }

    private trimOrNull(value: string | null | undefined): string | null {
        if (value === null || value === undefined) return null;
        const trimmed = value.trim();
        return trimmed.length === 0 ? null : trimmed;
    }

    goToHome() : void {
        this.navigationService.goToHome();
    }
}
