import { Component, inject, OnInit, signal } from '@angular/core';
import { NotifyService } from '../../../../../shared/services/notify.service';
import { TableLazyLoadEvent } from 'primeng/table';
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
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PasswordModule } from 'primeng/password';
import { User } from '../../../../../shared/services/user.service';
import { Restaurant } from '../../../../../shared/services/restaurant.service';
import { Admin } from '../../../../../shared/services/admin.service';
import { LoadingService } from '../../../../../core/services/loading.service';
import { UserDTO } from '../../../../../shared/models/userDTO.model';
import { UpdateUserDTO } from '../../../../../shared/models/updateUserDTO.model';
import { RegisterDTO } from '../../../../../shared/models/registerDTO.model';
import { RestaurantDTO } from '../../../../../shared/models/restaurantDTO.model';
import { Result } from '../../../../../shared/models/result.model';
import { ROLES } from '../../../../../core/constants/roles.constant';
import { PagedUserQuery } from '../../../../../shared/models/paged.model';

const UPDATE_USER_KEY = 'updateUser';
const CREATE_ACCOUNT_KEY = 'createAccount';

@Component({
    selector: 'app-users-overview',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        MultiSelectModule,
        ToggleSwitchModule,
        PasswordModule,
    ],
    templateUrl: './users-overview.html',
    styleUrl: './users-overview.scss',
})
export class UsersOverview implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly userService: User = inject(User);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly adminService: Admin = inject(Admin);
    private readonly messageService = inject(NotifyService);
    protected readonly loadingService: LoadingService = inject(LoadingService);
    protected readonly UPDATE_USER_KEY = UPDATE_USER_KEY;
    protected readonly CREATE_ACCOUNT_KEY = CREATE_ACCOUNT_KEY;

    protected readonly users = signal<UserDTO[]>([]);
    protected readonly totalCount = signal(0);
    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly restaurantOptions = signal<{ label: string; value: number }[]>([]);
    protected readonly loading = signal(false);
    protected readonly dialogVisible = signal(false);
    protected readonly createDialogVisible = signal(false);
    protected editing: UserDTO | null = null;

    protected readonly searchText = signal('');
    protected readonly roleFilter = signal<string | null>(null);
    protected readonly activeFilter = signal<boolean | null>(null);
    protected readonly restaurantFilter = signal<number | null>(null);

    protected readonly activeOptions = [
        { label: 'Active only', value: true },
        { label: 'Disabled only', value: false },
    ];

    private currentLazy: TableLazyLoadEvent | null = null;
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    protected readonly roleOptions = [
        { label: ROLES.SUPER_ADMIN, value: ROLES.SUPER_ADMIN },
        { label: ROLES.MANAGER, value: ROLES.MANAGER },
        { label: ROLES.COOK, value: ROLES.COOK },
        { label: ROLES.WAITER, value: ROLES.WAITER },
        { label: ROLES.CASHIER, value: ROLES.CASHIER },
        { label: 'Status Display', value: ROLES.STATUS_DISPLAY },
    ];

    editForm: FormGroup = this.fb.group({
        firstName: [''],
        lastName: [''],
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        role: ['', [Validators.required]],
        restaurantId: [null as number | null],
        restaurantIds: [[] as number[]],
        isActive: [true],
    });

    createForm: FormGroup = this.fb.group(
        {
            firstName: [''],
            lastName: [''],
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
            role: ['', [Validators.required]],
            restaurantId: [null as number | null, [Validators.required]],
        },
        { validators: this.passwordsMatchValidator },
    );

    ngOnInit(): void {
        this.loadRestaurants();
    }

    private loadRestaurants(): void {
        this.restaurantService.getAll().subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.restaurants.set(res.value);
                    this.restaurantOptions.set(
                        res.value.map((r) => ({ label: r.name, value: r.id })),
                    );
                }
            },
        });
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        this.currentLazy = event;
        this.fetchPage();
    }

    private fetchPage(): void {
        const event = this.currentLazy ?? { first: 0, rows: 10 };
        const first = event.first ?? 0;
        const rows = event.rows ?? 10;
        const sortField = (event.sortField as string | undefined) ?? null;
        const sortOrder = event.sortOrder ?? 1;

        const query: PagedUserQuery = {
            page: Math.floor(first / rows) + 1,
            pageSize: rows,
            search: this.searchText() || null,
            sortBy: sortField,
            sortDir: sortOrder >= 0 ? 'asc' : 'desc',
            role: this.roleFilter(),
            isActive: this.activeFilter(),
            restaurantId: this.restaurantFilter(),
        };

        this.loading.set(true);
        this.userService
            .getPaged(query)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.users.set(res.value.items);
                        this.totalCount.set(res.value.totalCount);
                    }
                },
            });
    }

    onSearchChange(value: string): void {
        this.searchText.set(value);
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.reload(), 300);
    }

    onFilterChange(): void {
        this.reload();
    }

    setRoleFilter(value: string | null): void {
        this.roleFilter.set(value);
        this.reload();
    }

    setActiveFilter(value: boolean | null): void {
        this.activeFilter.set(value);
        this.reload();
    }

    setRestaurantFilter(value: number | null): void {
        this.restaurantFilter.set(value);
        this.reload();
    }

    private reload(): void {
        if (this.currentLazy) {
            this.currentLazy = { ...this.currentLazy, first: 0 };
        }
        this.fetchPage();
    }

    load(): void {
        this.fetchPage();
    }

    restaurantName(id: number | null): string {
        if (id == null) return '-';
        return this.restaurants().find((r) => r.id === id)?.name ?? `#${id}`;
    }

    openCreate(): void {
        this.createForm.reset({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: '',
            restaurantId: null,
        });
        this.createDialogVisible.set(true);
    }

    closeCreate(): void {
        this.createDialogVisible.set(false);
    }

    createAccount(): void {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        const v = this.createForm.value;
        const data: RegisterDTO = {
            firstName: v.firstName?.trim() || null,
            lastName: v.lastName?.trim() || null,
            username: v.username.trim(),
            email: v.email.trim(),
            password: v.password,
            confirmPassword: v.confirmPassword,
            role: v.role,
            restaurantId: Number(v.restaurantId),
        };

        this.loadingService.start(CREATE_ACCOUNT_KEY);
        this.adminService
            .createAccount(data)
            .pipe(finalize(() => this.loadingService.stop(CREATE_ACCOUNT_KEY)))
            .subscribe({
                next: (res: Result<string>) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Account created',
                            detail: `${data.username} (${data.role}) created.`,
                            life: 3000,
                        });
                        this.closeCreate();
                        this.load();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not create account',
                            life: 3000,
                        });
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not create account',
                        life: 3000,
                    });
                },
            });
    }

    openEdit(user: UserDTO): void {
        this.editing = user;
        this.editForm.reset({
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            username: user.username,
            email: user.email,
            role: user.role,
            restaurantId: user.restaurantId,
            restaurantIds: [...user.restaurantIds],
            isActive: user.isActive,
        });
        this.dialogVisible.set(true);
    }

    close(): void {
        this.dialogVisible.set(false);
        this.editing = null;
    }

    save(): void {
        if (!this.editing) return;
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        const v = this.editForm.getRawValue();
        const payload: UpdateUserDTO = {
            firstName: v.firstName?.trim() || null,
            lastName: v.lastName?.trim() || null,
            username: v.username.trim(),
            email: v.email.trim(),
            role: v.role,
            restaurantId: v.restaurantId ?? null,
            restaurantIds: v.restaurantIds ?? [],
            isActive: v.isActive,
        };

        this.loadingService.start(UPDATE_USER_KEY);
        this.userService
            .update(this.editing.id, payload)
            .pipe(finalize(() => this.loadingService.stop(UPDATE_USER_KEY)))
            .subscribe({
                next: (res: Result<UserDTO>) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'User updated',
                            detail: `${res.value.username} saved.`,
                            life: 2500,
                        });
                        this.close();
                        this.load();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not update user',
                            life: 3000,
                        });
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not update user',
                        life: 3000,
                    });
                },
            });
    }

    isInvalid(form: FormGroup, controlName: string): boolean {
        const control = form.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    showMismatch(): boolean {
        const confirm = this.createForm.get('confirmPassword');
        return !!(
            this.createForm.hasError('passwordsMismatch') &&
            confirm &&
            (confirm.dirty || confirm.touched)
        );
    }

    getErrorMessage(form: FormGroup, controlName: string): string {
        const control = form.get(controlName);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        if (control.errors['email']) return 'Enter a valid email';
        if (control.errors['minlength']) {
            return `Minimum ${control.errors['minlength'].requiredLength} characters`;
        }
        return '';
    }

    private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
        const password = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        if (!password || !confirm) return null;
        return password === confirm ? null : { passwordsMismatch: true };
    }
}
