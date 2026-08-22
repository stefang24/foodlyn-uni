import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomerSessionService } from '../../../../shared/services/customer-session.service';
import { TableSessionService } from '../../../../shared/services/table-session.service';
import { TableLobbyService } from '../../../../shared/services/table-lobby.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ROLES } from '../../../../core/constants/roles.constant';

const START_KEY = 'startGuestSession';

@Component({
    selector: 'app-party-size-page',
    imports: [],
    templateUrl: './party-size-page.html',
    styleUrl: './party-size-page.scss',
})
export class PartySizePage implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly customerSession = inject(CustomerSessionService);
    private readonly tableSession = inject(TableSessionService);
    private readonly lobbyService = inject(TableLobbyService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly authService = inject(AuthService);
    private readonly destroyRef = inject(DestroyRef);
    protected readonly loadingService = inject(LoadingService);

    private joinedTableId: number | null = null;

    protected readonly START_KEY = START_KEY;
    protected readonly session = this.customerSession.session;
    protected readonly size = signal(2);
    protected readonly geo = signal<{ lat: number; lng: number } | null>(null);
    protected readonly error = signal<string | null>(null);

    async ngOnInit(): Promise<void> {
        const s = this.session();
        if (!s) {
            const token = this.route.snapshot.paramMap.get('token');
            this.router.navigate(['/t', token ?? '']);
            return;
        }
        const existing = this.customerSession.partySize();
        if (existing && existing > 0) this.size.set(existing);

        try {
            const coords = await this.getCurrentPosition();
            this.geo.set({ lat: coords.latitude, lng: coords.longitude });
        } catch {
        }

        const token = this.route.snapshot.paramMap.get('token') ?? '';
        await this.subscribeLobby(s.tableId, token);
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
    }

    private applyLobby(state: { stage: string; orderId: number | null }, token: string): void {
        switch (state.stage) {
            case 'Menu':
                this.joinExistingThenGoToMenu(token);
                break;
            case 'Tracking':
                if (state.orderId) this.router.navigate(['/t', token, 'order', state.orderId]);
                break;
            case 'Choice':
                this.router.navigate(['/t', token]);
                break;
            default:
                break;
        }
    }

    private joinExistingThenGoToMenu(token: string): void {
        const g = this.geo();
        this.tableSession
            .startGuest({
                qrToken: token,
                customerLatitude: g?.lat ?? null,
                customerLongitude: g?.lng ?? null,
                asGuest: true,
                partySize: this.size(),
            })
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.tableSession.setSession(res.value);
                        this.customerSession.setPartySize(res.value.partySize);
                        this.router.navigate(['/t', token, 'menu']);
                    } else {
                        this.router.navigate(['/t', token]);
                    }
                },
                error: () => this.router.navigate(['/t', token]),
            });
    }

    async ngOnDestroy(): Promise<void> {
        if (this.joinedTableId !== null) {
            await this.realtime.leaveTable(this.joinedTableId);
            this.joinedTableId = null;
        }
    }

    protected pick(n: number): void {
        this.size.set(n);
    }

    protected dec(): void {
        this.size.update((v) => Math.max(1, v - 1));
    }

    protected inc(): void {
        this.size.update((v) => Math.min(20, v + 1));
    }

    protected proceed(): void {
        const n = this.size();
        if (n <= 0) return;
        const token = this.route.snapshot.paramMap.get('token');
        if (!token) return;

        const g = this.geo();
        const dto = {
            qrToken: token,
            customerLatitude: g?.lat ?? null,
            customerLongitude: g?.lng ?? null,
            asGuest: false,
            partySize: n,
        };

        const role = this.authService.currentUser()?.role;
        const start$ = role === ROLES.USER
            ? this.tableSession.startUser(dto)
            : this.tableSession.startGuest({ ...dto, asGuest: true });

        this.loadingService.start(START_KEY);
        start$.subscribe({
                next: (res) => {
                    this.loadingService.stop(START_KEY);
                    if (res.isSuccess) {
                        this.tableSession.setSession(res.value);
                        this.customerSession.setPartySize(res.value.partySize);
                        this.router.navigate(['/t', token, 'menu']);
                    } else {
                        this.error.set(res.error ?? 'Could not start session.');
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.loadingService.stop(START_KEY);
                    this.error.set(err.error?.error ?? 'Could not start session.');
                },
            });
    }

    private getCurrentPosition(): Promise<GeolocationCoordinates> {
        return new Promise((resolve, reject) => {
            if (!('geolocation' in navigator)) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pos.coords),
                (err) => reject(err),
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
            );
        });
    }
}
