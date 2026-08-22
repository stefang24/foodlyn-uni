import { DatePipe } from '@angular/common';
import { NotifyService } from '../../../../shared/services/notify.service';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, finalize } from 'rxjs';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Restaurant, OpeningHourDTO, UpdateOpeningHoursDTO } from '../../../../shared/services/restaurant.service';
import { ReferenceService } from '../../../../shared/services/reference.service';
import { ImageUpload } from '../../../../shared/components/image-upload/image-upload';
import { Manager, AdminResetPasswordDTO } from '../../../../shared/services/manager.service';
import { TableService } from '../../../../shared/services/table.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { QrLabelPrintService } from '../../../../shared/services/qr-label-print.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ROLES } from '../../../../core/constants/roles.constant';
import { AuthService } from '../../../../shared/services/auth.service';
import { RegisterDTO } from '../../../../shared/models/registerDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';
import { UpdateRestaurantDTO } from '../../../../shared/models/updateRestaurantDTO.model';
import { UpdateUserDTO } from '../../../../shared/models/updateUserDTO.model';
import { PagedUserQuery } from '../../../../shared/models/paged.model';
import {
    RestaurantTableDTO,
    RestaurantTableStatus,
    BulkCreateRestaurantTablesDTO,
    CreateRestaurantTableDTO,
} from '../../../../shared/models/tableDTO.model';
import { UserDTO } from '../../../../shared/models/userDTO.model';
import { Result } from '../../../../shared/models/result.model';

type Tab = 'tables' | 'users' | 'hours' | 'location' | 'settings';

const SAVE_RESTAURANT_KEY = 'rp-save-restaurant';
const CREATE_ACCOUNT_KEY = 'rp-create-account';
const SAVE_TABLE_KEY = 'rp-save-table';
const SAVE_USER_KEY = 'rp-save-user';
const RESET_PASSWORD_KEY = 'rp-reset-password';
const SAVE_HOURS_KEY = 'rp-save-hours';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
    selector: 'app-manager-restaurants-page',
    imports: [
        DatePipe,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        PasswordModule,
        SelectModule,
        ToggleSwitchModule,
        ImageUpload,
    ],
    templateUrl: './restaurants-page.html',
    styleUrl: './restaurants-page.scss',
})
export class RestaurantsPage implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly managerService: Manager = inject(Manager);
    private readonly tableService: TableService = inject(TableService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly qrLabelPrint = inject(QrLabelPrintService);
    private readonly messageService = inject(NotifyService);
    private readonly referenceService = inject(ReferenceService);
    protected readonly loadingService: LoadingService = inject(LoadingService);
    private readonly auth = inject(AuthService);

    protected readonly isAdmin = this.auth.currentUser()?.role === ROLES.SUPER_ADMIN;

    protected readonly currencyOptions = computed(() =>
        this.referenceService.currencies().map((c) => ({
            label: `${c.code}${c.symbol ? ' (' + c.symbol + ')' : ''} - ${c.name}`,
            value: c.code,
        })),
    );
    protected readonly timezoneOptions = computed(() =>
        this.referenceService.timezones().map((t) => ({
            label: t.displayName,
            value: t.ianaName,
        })),
    );

    private tableStatusSub: Subscription | null = null;
    private joinedRestaurantId: number | null = null;

    protected readonly SAVE_RESTAURANT_KEY = SAVE_RESTAURANT_KEY;
    protected readonly CREATE_ACCOUNT_KEY = CREATE_ACCOUNT_KEY;
    protected readonly SAVE_TABLE_KEY = SAVE_TABLE_KEY;
    protected readonly SAVE_USER_KEY = SAVE_USER_KEY;
    protected readonly RESET_PASSWORD_KEY = RESET_PASSWORD_KEY;
    protected readonly SAVE_HOURS_KEY = SAVE_HOURS_KEY;
    protected readonly DAY_NAMES = DAY_NAMES;
    protected readonly DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

    protected readonly hoursDays = signal<OpeningHourDTO[]>(this.makeDefaultHours());

    private makeDefaultHours(): OpeningHourDTO[] {
        return Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            isOpen: false,
            openTime: '09:00',
            closeTime: '17:00',
        }));
    }

    protected hoursForDay(dayOfWeek: number): OpeningHourDTO {
        return (
            this.hoursDays().find((d) => d.dayOfWeek === dayOfWeek) ?? {
                dayOfWeek,
                isOpen: false,
                openTime: '09:00',
                closeTime: '17:00',
            }
        );
    }

    protected toggleDay(dayOfWeek: number, isOpen: boolean): void {
        this.hoursDays.update((list) =>
            list.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isOpen } : d)),
        );
    }

    protected setDayTime(dayOfWeek: number, field: 'openTime' | 'closeTime', value: string): void {
        this.hoursDays.update((list) =>
            list.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)),
        );
    }

    protected readonly hoursIncomplete = computed(() =>
        this.hoursDays().every((d) => !d.isOpen),
    );

    protected hoursCrossMidnight(dayOfWeek: number): boolean {
        const day = this.hoursForDay(dayOfWeek);
        if (!day.isOpen || !day.openTime || !day.closeTime) return false;
        return day.closeTime < day.openTime;
    }

    protected readonly roleOptions = [
        { label: ROLES.COOK, value: ROLES.COOK },
        { label: ROLES.WAITER, value: ROLES.WAITER },
        { label: ROLES.CASHIER, value: ROLES.CASHIER },
        { label: 'Status Display', value: ROLES.STATUS_DISPLAY },
    ];

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly selected = signal<RestaurantDTO | null>(null);
    protected readonly tab = signal<Tab>('tables');

    protected readonly tables = signal<RestaurantTableDTO[]>([]);
    protected readonly users = signal<UserDTO[]>([]);

    protected readonly createAccountOpen = signal(false);
    protected readonly createTableOpen = signal(false);
    protected readonly bulkTableOpen = signal(false);
    protected readonly editTableOpen = signal(false);
    protected readonly qrOpen = signal(false);
    protected readonly qrTable = signal<RestaurantTableDTO | null>(null);
    protected editingTable: RestaurantTableDTO | null = null;

    protected readonly editUserOpen = signal(false);
    protected readonly resetPasswordOpen = signal(false);
    protected editingUser: UserDTO | null = null;

    protected readonly selectedRestaurantUsers = computed(() => this.users());
    protected readonly usersTotal = signal(0);
    protected readonly usersLoading = signal(false);
    protected readonly userSearch = signal('');
    protected readonly userRoleFilter = signal<string | null>(null);
    protected readonly userActiveFilter = signal<boolean | null>(null);

    protected readonly userActiveOptions = [
        { label: 'Active only', value: true },
        { label: 'Disabled only', value: false },
    ];

    private currentUsersLazy: TableLazyLoadEvent | null = null;
    private userSearchTimer: ReturnType<typeof setTimeout> | null = null;

    protected readonly tableStats = computed(() => {
        const list = this.tables();
        return {
            total: list.length,
            free: list.filter((t) => t.status === 'Free').length,
            occupied: list.filter((t) => t.status === 'Occupied' || t.status === 'Eating').length,
            cleaning: list.filter((t) => t.status === 'Cleaning').length,
        };
    });

    settingsForm: FormGroup = this.fb.group({
        description: ['', [Validators.maxLength(1000)]],
        email: ['', [Validators.email, Validators.maxLength(100)]],
        phoneNumber: ['', [Validators.maxLength(30)]],
        website: ['', [Validators.maxLength(200)]],
        currency: ['', [Validators.maxLength(3), Validators.pattern(/^[A-Za-z]{0,3}$/)]],
        timeZone: ['', [Validators.maxLength(50)]],
        cuisine: ['', [Validators.maxLength(100)]],
        logoUrl: ['', [Validators.maxLength(500)]],
        coverImageUrl: ['', [Validators.maxLength(500)]],
    });

    hoursForm: FormGroup = this.fb.group({
        openingHours: ['', [Validators.maxLength(500)]],
    });

    locationForm: FormGroup = this.fb.group({
        streetAddress: ['', [Validators.maxLength(200)]],
        city: ['', [Validators.maxLength(100)]],
        postalCode: ['', [Validators.maxLength(20)]],
        country: ['', [Validators.maxLength(100)]],
        latitude: [null as number | null],
        longitude: [null as number | null],
    });

    createAccountForm: FormGroup = this.fb.group(
        {
            firstName: [''],
            lastName: [''],
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
            role: ['', [Validators.required]],
        },
        { validators: this.passwordsMatchValidator },
    );

    tableForm: FormGroup = this.fb.group({
        number: [1, [Validators.required, Validators.min(1)]],
        label: ['', [Validators.maxLength(100)]],
        capacity: [2, [Validators.required, Validators.min(1), Validators.max(50)]],
        location: ['', [Validators.maxLength(200)]],
        notes: ['', [Validators.maxLength(1000)]],
    });

    editTableForm: FormGroup = this.fb.group({
        number: [1, [Validators.required, Validators.min(1)]],
        label: ['', [Validators.maxLength(100)]],
        capacity: [2, [Validators.required, Validators.min(1), Validators.max(50)]],
        location: ['', [Validators.maxLength(200)]],
        notes: ['', [Validators.maxLength(1000)]],
        isActive: [true],
    });

    bulkForm: FormGroup = this.fb.group({
        count: [10, [Validators.required, Validators.min(1), Validators.max(200)]],
        startingNumber: [1, [Validators.min(0)]],
        capacity: [2, [Validators.required, Validators.min(1), Validators.max(50)]],
    });

    editUserForm: FormGroup = this.fb.group({
        firstName: [''],
        lastName: [''],
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        role: ['', [Validators.required]],
        isActive: [true],
    });

    resetPasswordForm: FormGroup = this.fb.group(
        {
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
        },
        { validators: this.passwordsMatchValidator },
    );

    ngOnInit(): void {
        this.referenceService.getCurrencies().subscribe();
        this.referenceService.getTimezones().subscribe();
        this.loadRestaurants();
        this.tableStatusSub = this.realtime.tableStatusChanged$.subscribe((u) => {
            this.tables.update((list) =>
                list.map((t) =>
                    t.id === u.id
                        ? {
                              ...t,
                              status: u.status as RestaurantTableStatus,
                              currentPartySize: u.currentPartySize,
                          }
                        : t,
                ),
            );
        });
    }

    async ngOnDestroy(): Promise<void> {
        this.tableStatusSub?.unsubscribe();
        if (this.joinedRestaurantId != null) {
            await this.realtime.leaveStaff('manager', this.joinedRestaurantId);
            this.joinedRestaurantId = null;
        }
    }

    private async joinManagerGroup(restaurantId: number): Promise<void> {
        if (this.joinedRestaurantId === restaurantId) return;
        if (this.joinedRestaurantId != null) {
            try {
                await this.realtime.leaveStaff('manager', this.joinedRestaurantId);
            } catch {
            }
        }
        try {
            await this.realtime.joinStaff('manager', restaurantId);
            this.joinedRestaurantId = restaurantId;
        } catch {
        }
    }

    private loadRestaurants(): void {
        this.restaurantService.getMine().subscribe({
            next: (res) => {
                if (res.isSuccess && res.value.length > 0) {
                    this.restaurants.set(res.value);
                    this.select(res.value[0]);
                }
            },
        });
    }

    private loadUsers(): void {
        this.fetchUsersPage();
    }

    onUsersLazyLoad(event: TableLazyLoadEvent): void {
        this.currentUsersLazy = event;
        this.fetchUsersPage();
    }

    private fetchUsersPage(): void {
        const r = this.selected();
        if (!r) {
            this.users.set([]);
            this.usersTotal.set(0);
            return;
        }
        const event = this.currentUsersLazy ?? { first: 0, rows: 10 };
        const first = event.first ?? 0;
        const rows = event.rows ?? 10;
        const sortField = (event.sortField as string | undefined) ?? null;
        const sortOrder = event.sortOrder ?? 1;

        const query: PagedUserQuery = {
            page: Math.floor(first / rows) + 1,
            pageSize: rows,
            search: this.userSearch() || null,
            sortBy: sortField,
            sortDir: sortOrder >= 0 ? 'asc' : 'desc',
            role: this.userRoleFilter(),
            isActive: this.userActiveFilter(),
            restaurantId: r.id,
        };

        this.usersLoading.set(true);
        this.managerService
            .getUsersPaged(query)
            .pipe(finalize(() => this.usersLoading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.users.set(res.value.items);
                        this.usersTotal.set(res.value.totalCount);
                    }
                },
            });
    }

    onUserSearchChange(value: string): void {
        this.userSearch.set(value);
        if (this.userSearchTimer) clearTimeout(this.userSearchTimer);
        this.userSearchTimer = setTimeout(() => this.reloadUsers(), 300);
    }

    setUserRoleFilter(value: string | null): void {
        this.userRoleFilter.set(value);
        this.reloadUsers();
    }

    setUserActiveFilter(value: boolean | null): void {
        this.userActiveFilter.set(value);
        this.reloadUsers();
    }

    private reloadUsers(): void {
        if (this.currentUsersLazy) {
            this.currentUsersLazy = { ...this.currentUsersLazy, first: 0 };
        }
        this.fetchUsersPage();
    }

    protected select(r: RestaurantDTO): void {
        this.selected.set(r);
        this.settingsForm.reset({
            description: r.description ?? '',
            email: r.email ?? '',
            phoneNumber: r.phoneNumber ?? '',
            website: r.website ?? '',
            currency: r.currency ?? '',
            timeZone: r.timeZone ?? '',
            cuisine: r.cuisine ?? '',
            logoUrl: r.logoUrl ?? '',
            coverImageUrl: r.coverImageUrl ?? '',
        });
        this.hoursForm.reset({ openingHours: r.openingHours ?? '' });
        this.locationForm.reset({
            streetAddress: r.streetAddress ?? '',
            city: r.city ?? '',
            postalCode: r.postalCode ?? '',
            country: r.country ?? '',
            latitude: r.latitude,
            longitude: r.longitude,
        });
        this.loadTables(r.id);
        this.joinManagerGroup(r.id);
        this.loadHours(r.id);
        this.reloadUsers();
    }

    private loadHours(restaurantId: number): void {
        this.restaurantService.getOpeningHours(restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    const map = new Map(res.value.map((h) => [h.dayOfWeek, h]));
                    this.hoursDays.set(
                        Array.from({ length: 7 }, (_, i) =>
                            map.get(i) ?? {
                                dayOfWeek: i,
                                isOpen: false,
                                openTime: '09:00',
                                closeTime: '17:00',
                            },
                        ),
                    );
                }
            },
        });
    }

    protected saveOpeningHours(): void {
        const r = this.selected();
        if (!r) return;
        const payload: UpdateOpeningHoursDTO = {
            days: this.hoursDays().map((d) => ({
                dayOfWeek: d.dayOfWeek,
                isOpen: d.isOpen,
                openTime: d.isOpen ? (d.openTime || '09:00') : null,
                closeTime: d.isOpen ? (d.closeTime || '17:00') : null,
            })),
        };
        this.loadingService.start(SAVE_HOURS_KEY);
        this.restaurantService
            .saveOpeningHours(r.id, payload)
            .pipe(finalize(() => this.loadingService.stop(SAVE_HOURS_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Opening hours saved',
                            life: 2000,
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
            });
    }

    protected setTab(t: Tab): void {
        this.tab.set(t);
    }

    private loadTables(restaurantId: number): void {
        this.tableService.getByRestaurant(restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.tables.set([...res.value].sort((a, b) => a.number - b.number));
                }
            },
        });
    }

    protected saveSettings(): void {
        const r = this.selected();
        if (!r) return;
        if (this.settingsForm.invalid) {
            this.settingsForm.markAllAsTouched();
            return;
        }
        const v = this.settingsForm.value;
        const payload: UpdateRestaurantDTO = {
            description: this.trimOrNull(v.description),
            email: this.trimOrNull(v.email),
            phoneNumber: this.trimOrNull(v.phoneNumber),
            website: this.trimOrNull(v.website),
            currency: v.currency ? v.currency.trim().toUpperCase() : null,
            timeZone: this.trimOrNull(v.timeZone),
            cuisine: this.trimOrNull(v.cuisine),
            logoUrl: this.trimOrNull(v.logoUrl),
            coverImageUrl: this.trimOrNull(v.coverImageUrl),
            streetAddress: r.streetAddress,
            city: r.city,
            postalCode: r.postalCode,
            country: r.country,
            latitude: r.latitude,
            longitude: r.longitude,
            openingHours: r.openingHours,
            taxId: r.taxId,
        };
        this.saveRestaurant(r.id, payload, 'Settings saved');
    }

    protected saveHours(): void {
        const r = this.selected();
        if (!r) return;
        const v = this.hoursForm.value;
        const payload: UpdateRestaurantDTO = {
            openingHours: this.trimOrNull(v.openingHours),
            description: r.description,
            email: r.email,
            phoneNumber: r.phoneNumber,
            website: r.website,
            currency: r.currency,
            timeZone: r.timeZone,
            cuisine: r.cuisine,
            logoUrl: r.logoUrl,
            coverImageUrl: r.coverImageUrl,
            streetAddress: r.streetAddress,
            city: r.city,
            postalCode: r.postalCode,
            country: r.country,
            latitude: r.latitude,
            longitude: r.longitude,
            taxId: r.taxId,
        };
        this.saveRestaurant(r.id, payload, 'Opening hours saved');
    }

    protected saveLocation(): void {
        const r = this.selected();
        if (!r) return;
        const v = this.locationForm.value;
        const payload: UpdateRestaurantDTO = {
            streetAddress: this.trimOrNull(v.streetAddress),
            city: this.trimOrNull(v.city),
            postalCode: this.trimOrNull(v.postalCode),
            country: this.trimOrNull(v.country),
            latitude: this.numOrNull(v.latitude),
            longitude: this.numOrNull(v.longitude),
            description: r.description,
            email: r.email,
            phoneNumber: r.phoneNumber,
            website: r.website,
            currency: r.currency,
            timeZone: r.timeZone,
            cuisine: r.cuisine,
            logoUrl: r.logoUrl,
            coverImageUrl: r.coverImageUrl,
            openingHours: r.openingHours,
            taxId: r.taxId,
        };
        this.saveRestaurant(r.id, payload, 'Location saved');
    }

    private saveRestaurant(id: number, payload: UpdateRestaurantDTO, successMsg: string): void {
        this.loadingService.start(SAVE_RESTAURANT_KEY);
        this.restaurantService
            .update(id, payload)
            .pipe(finalize(() => this.loadingService.stop(SAVE_RESTAURANT_KEY)))
            .subscribe({
                next: (res: Result<RestaurantDTO>) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: successMsg,
                            life: 2500,
                        });
                        this.restaurants.update((list) =>
                            list.map((r) => (r.id === res.value.id ? res.value : r)),
                        );
                        this.selected.set(res.value);
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

    protected openCreateAccount(): void {
        this.createAccountForm.reset({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: '',
        });
        this.createAccountOpen.set(true);
    }

    protected closeCreateAccount(): void {
        this.createAccountOpen.set(false);
    }

    protected submitCreateAccount(): void {
        const r = this.selected();
        if (!r) return;
        if (this.createAccountForm.invalid) {
            this.createAccountForm.markAllAsTouched();
            return;
        }
        const v = this.createAccountForm.value;
        const data: RegisterDTO = {
            firstName: v.firstName?.trim() || null,
            lastName: v.lastName?.trim() || null,
            username: v.username.trim(),
            email: v.email.trim(),
            password: v.password,
            confirmPassword: v.confirmPassword,
            role: v.role,
            restaurantId: r.id,
        };
        this.loadingService.start(CREATE_ACCOUNT_KEY);
        this.managerService
            .createAccount(data)
            .pipe(finalize(() => this.loadingService.stop(CREATE_ACCOUNT_KEY)))
            .subscribe({
                next: (res: Result<string>) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Account created',
                            detail: `${data.username} (${data.role})`,
                            life: 2500,
                        });
                        this.closeCreateAccount();
                        this.loadUsers();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not create account',
                            life: 3000,
                        });
                    }
                },
                error: (err: HttpErrorResponse) =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not create account',
                        life: 3000,
                    }),
            });
    }

    protected openEditUser(u: UserDTO): void {
        this.editingUser = u;
        this.editUserForm.reset({
            firstName: u.firstName ?? '',
            lastName: u.lastName ?? '',
            username: u.username,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
        });
        this.editUserOpen.set(true);
    }

    protected closeEditUser(): void {
        this.editUserOpen.set(false);
        this.editingUser = null;
    }

    protected submitEditUser(): void {
        if (!this.editingUser) return;
        if (this.editUserForm.invalid) {
            this.editUserForm.markAllAsTouched();
            return;
        }
        const r = this.selected();
        if (!r) return;
        const v = this.editUserForm.value;
        const existing = this.editingUser;
        const restaurantIds = Array.from(
            new Set([
                ...existing.restaurantIds.filter((id) =>
                    this.restaurants().some((rest) => rest.id === id),
                ),
                r.id,
            ]),
        );
        const payload: UpdateUserDTO = {
            firstName: v.firstName?.trim() || null,
            lastName: v.lastName?.trim() || null,
            email: v.email.trim(),
            username: v.username.trim(),
            role: v.role,
            restaurantId: existing.restaurantId ?? r.id,
            restaurantIds,
            isActive: !!v.isActive,
        };
        this.loadingService.start(SAVE_USER_KEY);
        this.managerService
            .updateUser(existing.id, payload)
            .pipe(finalize(() => this.loadingService.stop(SAVE_USER_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'User updated',
                            life: 2000,
                        });
                        this.closeEditUser();
                        this.loadUsers();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not update',
                            life: 3000,
                        });
                    }
                },
                error: (err: HttpErrorResponse) =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not update',
                        life: 3000,
                    }),
            });
    }

    protected openResetPassword(u: UserDTO): void {
        this.editingUser = u;
        this.resetPasswordForm.reset({ newPassword: '', confirmPassword: '' });
        this.resetPasswordOpen.set(true);
    }

    protected closeResetPassword(): void {
        this.resetPasswordOpen.set(false);
        this.editingUser = null;
    }

    protected submitResetPassword(): void {
        if (!this.editingUser) return;
        if (this.resetPasswordForm.invalid) {
            this.resetPasswordForm.markAllAsTouched();
            return;
        }
        const v = this.resetPasswordForm.value;
        const payload: AdminResetPasswordDTO = {
            newPassword: v.newPassword,
            confirmPassword: v.confirmPassword,
        };
        this.loadingService.start(RESET_PASSWORD_KEY);
        this.managerService
            .resetUserPassword(this.editingUser.id, payload)
            .pipe(finalize(() => this.loadingService.stop(RESET_PASSWORD_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Password updated',
                            life: 2000,
                        });
                        this.closeResetPassword();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not reset',
                            life: 3000,
                        });
                    }
                },
                error: (err: HttpErrorResponse) =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not reset',
                        life: 3000,
                    }),
            });
    }

    protected showResetMismatch(): boolean {
        const confirm = this.resetPasswordForm.get('confirmPassword');
        return !!(
            this.resetPasswordForm.hasError('passwordsMismatch') &&
            confirm &&
            (confirm.dirty || confirm.touched)
        );
    }

    protected openCreateTable(): void {
        const next = (this.tables().reduce((m, t) => Math.max(m, t.number), 0) || 0) + 1;
        this.tableForm.reset({
            number: next,
            label: '',
            capacity: 2,
            location: '',
            notes: '',
        });
        this.createTableOpen.set(true);
    }

    protected closeCreateTable(): void {
        this.createTableOpen.set(false);
    }

    protected submitCreateTable(): void {
        const r = this.selected();
        if (!r) return;
        if (this.tableForm.invalid) {
            this.tableForm.markAllAsTouched();
            return;
        }
        const v = this.tableForm.value;
        const payload: CreateRestaurantTableDTO = {
            restaurantId: r.id,
            number: Number(v.number),
            label: this.trimOrNull(v.label),
            capacity: Number(v.capacity) || 1,
            location: this.trimOrNull(v.location),
            notes: this.trimOrNull(v.notes),
            isActive: true,
        };
        this.loadingService.start(SAVE_TABLE_KEY);
        this.tableService
            .create(payload)
            .pipe(finalize(() => this.loadingService.stop(SAVE_TABLE_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Table added',
                            life: 2000,
                        });
                        this.closeCreateTable();
                        this.loadTables(r.id);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not create',
                            life: 3000,
                        });
                    }
                },
            });
    }

    protected openBulkTable(): void {
        const next = (this.tables().reduce((m, t) => Math.max(m, t.number), 0) || 0) + 1;
        this.bulkForm.reset({ count: 10, startingNumber: next, capacity: 2 });
        this.bulkTableOpen.set(true);
    }

    protected closeBulkTable(): void {
        this.bulkTableOpen.set(false);
    }

    protected submitBulkTable(): void {
        const r = this.selected();
        if (!r) return;
        if (this.bulkForm.invalid) {
            this.bulkForm.markAllAsTouched();
            return;
        }
        const v = this.bulkForm.value;
        const payload: BulkCreateRestaurantTablesDTO = {
            restaurantId: r.id,
            count: Number(v.count),
            startingNumber: Number(v.startingNumber) || 0,
            capacity: Number(v.capacity) || 1,
            location: null,
        };
        this.loadingService.start(SAVE_TABLE_KEY);
        this.tableService
            .bulkCreate(payload)
            .pipe(finalize(() => this.loadingService.stop(SAVE_TABLE_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Tables added',
                            life: 2000,
                        });
                        this.closeBulkTable();
                        this.loadTables(r.id);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not create',
                            life: 3000,
                        });
                    }
                },
            });
    }

    protected openEditTable(t: RestaurantTableDTO): void {
        this.editingTable = t;
        this.editTableForm.reset({
            number: t.number,
            label: t.label ?? '',
            capacity: t.capacity,
            location: t.location ?? '',
            notes: t.notes ?? '',
            isActive: t.isActive,
        });
        this.editTableOpen.set(true);
    }

    protected closeEditTable(): void {
        this.editTableOpen.set(false);
        this.editingTable = null;
    }

    protected submitEditTable(): void {
        if (!this.editingTable) return;
        if (this.editTableForm.invalid) {
            this.editTableForm.markAllAsTouched();
            return;
        }
        const v = this.editTableForm.value;
        const payload = {
            number: Number(v.number) || 1,
            label: this.trimOrNull(v.label),
            capacity: Number(v.capacity) || 1,
            location: this.trimOrNull(v.location),
            notes: this.trimOrNull(v.notes),
            status: this.editingTable.status,
            currentPartySize: this.editingTable.currentPartySize,
            isActive: !!v.isActive,
        };

        this.loadingService.start(SAVE_TABLE_KEY);
        this.tableService
            .update(this.editingTable.id, payload)
            .pipe(finalize(() => this.loadingService.stop(SAVE_TABLE_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Table updated',
                            life: 2000,
                        });
                        this.closeEditTable();
                        const r = this.selected();
                        if (r) this.loadTables(r.id);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not save',
                            life: 3000,
                        });
                    }
                },
            });
    }

    protected deleteTable(t: RestaurantTableDTO): void {
        if (t.status !== 'Free') return;
        if (!confirm(`Delete table #${t.number}?`)) return;
        this.tableService.delete(t.id).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Table deleted',
                        life: 2000,
                    });
                    const r = this.selected();
                    if (r) this.loadTables(r.id);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not delete',
                        life: 3000,
                    });
                }
            },
        });
    }

    protected rotateToken(t: RestaurantTableDTO): void {
        if (t.status !== 'Free') return;
        if (!confirm(`Rotate QR token for table #${t.number}? Existing QR will stop working.`)) return;
        this.tableService.rotateToken(t.id).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Token rotated',
                        life: 2000,
                    });
                    const r = this.selected();
                    if (r) this.loadTables(r.id);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not rotate',
                        life: 3000,
                    });
                }
            },
        });
    }

    protected openQr(t: RestaurantTableDTO): void {
        this.qrTable.set(t);
        this.qrOpen.set(true);
    }

    protected canPrintLabels(): boolean {
        return this.tables().some((t) => t.isActive);
    }

    protected printQrLabels(): void {
        const restaurant = this.selected();
        if (!restaurant) return;
        this.qrLabelPrint.print(restaurant, this.tables());
    }

    protected closeQr(): void {
        this.qrOpen.set(false);
        this.qrTable.set(null);
    }

    protected qrUrl(token: string): string {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/t/${token}`;
    }

    protected qrImageUrl(token: string): string {
        const target = encodeURIComponent(this.qrUrl(token));
        return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${target}`;
    }

    protected copyQrLink(token: string): void {
        const url = this.qrUrl(token);
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Link copied',
                    detail: url,
                    life: 2000,
                });
            });
        }
    }

    protected tableStatusClass(status: string): string {
        return 'ts-' + status.toLowerCase();
    }

    protected showMismatch(): boolean {
        const confirm = this.createAccountForm.get('confirmPassword');
        return !!(
            this.createAccountForm.hasError('passwordsMismatch') &&
            confirm &&
            (confirm.dirty || confirm.touched)
        );
    }

    protected isInvalid(form: FormGroup, controlName: string): boolean {
        const control = form.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    protected getErrorMessage(form: FormGroup, controlName: string): string {
        const control = form.get(controlName);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        if (control.errors['email']) return 'Enter a valid email';
        if (control.errors['minlength'])
            return `Minimum ${control.errors['minlength'].requiredLength} characters`;
        if (control.errors['maxlength'])
            return `Maximum ${control.errors['maxlength'].requiredLength} characters`;
        if (control.errors['pattern']) {
            if (controlName === 'currency') return '3-letter currency code (e.g. EUR)';
            return 'Invalid format';
        }
        return '';
    }

    private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
        const password = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        if (!password || !confirm) return null;
        return password === confirm ? null : { passwordsMismatch: true };
    }

    private trimOrNull(value: string | null | undefined): string | null {
        if (value === null || value === undefined) return null;
        const trimmed = value.trim();
        return trimmed.length === 0 ? null : trimmed;
    }

    private numOrNull(value: number | string | null | undefined): number | null {
        if (value === null || value === undefined || value === '') return null;
        const n = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(n) ? n : null;
    }
}
