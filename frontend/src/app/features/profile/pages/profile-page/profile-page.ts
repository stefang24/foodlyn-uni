import { CurrencyPipe, DatePipe } from '@angular/common';
import { NotifyService } from '../../../../shared/services/notify.service';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../../shared/services/auth.service';
import {
    ChangePasswordDTO,
    UpdateMyProfileDTO,
    User,
} from '../../../../shared/services/user.service';
import { OrderService } from '../../../../shared/services/order.service';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ROLES } from '../../../../core/constants/roles.constant';
import { UserDTO } from '../../../../shared/models/userDTO.model';
import { OrderDTO } from '../../../../shared/models/orderDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';
import { ImageUpload } from '../../../../shared/components/image-upload/image-upload';
import { FileUploadService } from '../../../../shared/services/file-upload.service';

const SAVE_KEY = 'profileSave';
const PWD_KEY = 'profilePwd';

type Tab = 'profile' | 'security' | 'orders';

@Component({
    selector: 'app-profile-page',
    imports: [
        CurrencyPipe,
        DatePipe,
        ReactiveFormsModule,
        DialogModule,
        InputTextModule,
        PasswordModule,
        ImageUpload,
    ],
    templateUrl: './profile-page.html',
    styleUrl: './profile-page.scss',
})
export class ProfilePage implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly userService: User = inject(User);
    private readonly orderService: OrderService = inject(OrderService);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly auth = inject(AuthService);
    private readonly navigation = inject(NavigationService);
    private readonly router = inject(Router);
    private readonly messageService = inject(NotifyService);
    private readonly fileUpload = inject(FileUploadService);
    protected readonly loadingService = inject(LoadingService);

    protected readonly SAVE_KEY = SAVE_KEY;
    protected readonly PWD_KEY = PWD_KEY;

    protected readonly profile = signal<UserDTO | null>(null);
    protected readonly orders = signal<OrderDTO[]>([]);
    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly tab = signal<Tab>('profile');

    protected readonly photoUrl = computed(() => {
        const raw = this.profile()?.profilePictureUrl;
        return raw ? this.fileUpload.resolveUrl(raw) : null;
    });

    protected readonly isCustomer = computed(() => this.profile()?.role === ROLES.USER);
    protected readonly isStatusDisplay = computed(
        () => this.profile()?.role === ROLES.STATUS_DISPLAY,
    );

    protected readonly initials = computed(() => {
        const p = this.profile();
        if (!p) return '?';
        const src = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.username;
        const parts = src.split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });

    protected readonly fullName = computed(() => {
        const p = this.profile();
        if (!p) return '';
        return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.username;
    });

    protected readonly orderStats = computed(() => {
        const list = this.orders();
        const total = list.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
        const completed = list.filter((o) => o.status === 'Completed').length;
        return { count: list.length, total, completed };
    });

    profileForm: FormGroup = this.fb.group({
        firstName: ['', [Validators.maxLength(80)]],
        lastName: ['', [Validators.maxLength(80)]],
        username: [
            '',
            [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(30),
                Validators.pattern(/^[a-z\.A-Z0-9_]+$/),
            ],
        ],
        email: [{ value: '', disabled: true }],
        profilePictureUrl: [null as string | null],
    });

    passwordForm: FormGroup = this.fb.group(
        {
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
        },
        { validators: this.passwordsMatchValidator },
    );

    protected readonly orderDetailOpen = signal(false);
    protected readonly orderDetail = signal<OrderDTO | null>(null);

    ngOnInit(): void {
        this.loadProfile();
    }

    private loadProfile(): void {
        this.userService.getMyProfile().subscribe({
            next: (res) => {
                if (!res.isSuccess || !res.value) return;
                this.profile.set(res.value);
                this.profileForm.patchValue({
                    firstName: res.value.firstName ?? '',
                    lastName: res.value.lastName ?? '',
                    username: res.value.username,
                    email: res.value.email,
                    profilePictureUrl: res.value.profilePictureUrl ?? null,
                });

                if (res.value.role === ROLES.USER) {
                    this.loadOrders();
                }
            },
        });
    }

    private loadOrders(): void {
        forkJoin({
            mine: this.orderService.getMine(),
            restaurants: this.restaurantService.getPublic(),
        }).subscribe({
            next: ({ mine, restaurants }) => {
                if (mine.isSuccess) {
                    this.orders.set(
                        [...mine.value].sort(
                            (a, b) =>
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime(),
                        ),
                    );
                }
                if (restaurants.isSuccess) this.restaurants.set(restaurants.value);
            },
        });
    }

    protected setTab(t: Tab): void {
        this.tab.set(t);
    }

    protected restaurantById(id: number | null | undefined): RestaurantDTO | null {
        if (id == null) return null;
        return this.restaurants().find((r) => r.id === id) ?? null;
    }

    protected restaurantName(id: number | null | undefined): string {
        return this.restaurantById(id)?.name ?? 'Restaurant';
    }

    protected statusClass(s: string): string {
        return 'st-' + s.toLowerCase();
    }

    protected back(): void {
        this.navigation.goToDashboard();
    }

    protected goToStatusDisplay(): void {
        this.router.navigate(['/status']);
    }

    protected openOrderRestaurant(o: OrderDTO, event: Event): void {
        event.stopPropagation();
        const r = this.restaurantById(o.restaurantId);
        if (r) this.router.navigate(['/r', r.slug]);
    }

    protected openOrderDetail(o: OrderDTO): void {
        this.orderDetail.set(o);
        this.orderDetailOpen.set(true);
    }

    protected closeOrderDetail(): void {
        this.orderDetailOpen.set(false);
        this.orderDetail.set(null);
    }

    protected saveProfile(): void {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }
        const v = this.profileForm.getRawValue();
        const data: UpdateMyProfileDTO = {
            firstName: v.firstName?.trim() || null,
            lastName: v.lastName?.trim() || null,
            email: (v.email ?? '').trim(),
            username: v.username.trim(),
            profilePictureUrl: v.profilePictureUrl ?? null,
        };

        this.loadingService.start(SAVE_KEY);
        this.userService
            .updateMyProfile(data)
            .pipe(finalize(() => this.loadingService.stop(SAVE_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.profile.set(res.value);
                        this.auth.loadCurrentUser().subscribe();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Profile saved',
                            life: 2500,
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not save',
                            life: 3000,
                        });
                    }
                },
                error: (err: HttpErrorResponse) =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not save',
                        life: 3000,
                    }),
            });
    }

    protected changePassword(): void {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }
        const v = this.passwordForm.value;
        const data: ChangePasswordDTO = {
            currentPassword: v.currentPassword,
            newPassword: v.newPassword,
            confirmPassword: v.confirmPassword,
        };

        this.loadingService.start(PWD_KEY);
        this.userService
            .changePassword(data)
            .pipe(finalize(() => this.loadingService.stop(PWD_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Password updated',
                            life: 2500,
                        });
                        this.passwordForm.reset({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not change password',
                            life: 3000,
                        });
                    }
                },
                error: (err: HttpErrorResponse) =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not change password',
                        life: 3000,
                    }),
            });
    }

    protected showMismatch(): boolean {
        const c = this.passwordForm.get('confirmPassword');
        return !!(
            this.passwordForm.hasError('passwordsMismatch') && c && (c.dirty || c.touched)
        );
    }

    protected isInvalid(form: FormGroup, controlName: string): boolean {
        const c = form.get(controlName);
        return !!(c && c.invalid && (c.dirty || c.touched));
    }

    protected getErrorMessage(form: FormGroup, controlName: string): string {
        const c = form.get(controlName);
        if (!c || !c.errors) return '';
        if (c.errors['required']) return 'This field is required';
        if (c.errors['email']) return 'Enter a valid email';
        if (c.errors['minlength'])
            return `Minimum ${c.errors['minlength'].requiredLength} characters`;
        if (c.errors['maxlength'])
            return `Maximum ${c.errors['maxlength'].requiredLength} characters`;
        if (c.errors['pattern'] && controlName === 'username')
            return 'Letters, numbers and underscores only';
        return 'Invalid';
    }

    protected logout(): void {
        this.auth.logout().subscribe({
            next: () => this.navigation.goToLogin(),
            error: () => this.navigation.goToLogin(),
        });
    }

    private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
        const password = group.get('newPassword')?.value;
        const confirm = group.get('confirmPassword')?.value;
        if (!password || !confirm) return null;
        return password === confirm ? null : { passwordsMismatch: true };
    }
}
