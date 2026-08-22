import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NotifyService } from '../../../../../shared/services/notify.service';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import {
    OpeningHourDTO,
    Restaurant,
    UpdateOpeningHoursDTO,
} from '../../../../../shared/services/restaurant.service';
import { ReferenceService } from '../../../../../shared/services/reference.service';
import { ImageUpload } from '../../../../../shared/components/image-upload/image-upload';
import { LoadingService } from '../../../../../core/services/loading.service';
import { RestaurantDTO } from '../../../../../shared/models/restaurantDTO.model';
import { UpdateRestaurantDTO } from '../../../../../shared/models/updateRestaurantDTO.model';
import { CreateRestaurantDTO } from '../../../../../shared/models/createRestaurantDTO.model';
import { Result } from '../../../../../shared/models/result.model';
import { PagedRestaurantQuery } from '../../../../../shared/models/paged.model';

const UPDATE_RESTAURANT_KEY = 'updateRestaurant';
const CREATE_RESTAURANT_KEY = 'createRestaurant';
const SAVE_HOURS_KEY = 'saveHours';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
    selector: 'app-restaurants-overview',
    imports: [
        DatePipe,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        ToggleSwitchModule,
        ImageUpload,
    ],
    templateUrl: './restaurants-overview.html',
    styleUrl: './restaurants-overview.scss',
})
export class RestaurantsOverview implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly messageService = inject(NotifyService);
    private readonly referenceService = inject(ReferenceService);
    private readonly router = inject(Router);
    protected readonly loadingService: LoadingService = inject(LoadingService);

    protected readonly DAY_NAMES = DAY_NAMES;
    protected readonly DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];
    protected readonly SAVE_HOURS_KEY = SAVE_HOURS_KEY;

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
    protected readonly UPDATE_RESTAURANT_KEY = UPDATE_RESTAURANT_KEY;
    protected readonly CREATE_RESTAURANT_KEY = CREATE_RESTAURANT_KEY;

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly totalCount = signal(0);
    protected readonly loading = signal(false);
    protected readonly dialogVisible = signal(false);
    protected readonly createDialogVisible = signal(false);
    protected editing: RestaurantDTO | null = null;
    protected allowRename = true;

    protected readonly searchText = signal('');
    protected readonly activeFilter = signal<boolean | null>(null);

    protected readonly activeOptions = [
        { label: 'Active only', value: true },
        { label: 'Inactive only', value: false },
    ];

    private currentLazy: TableLazyLoadEvent | null = null;
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    editForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(150)]],
        description: ['', [Validators.maxLength(1000)]],
        email: ['', [Validators.email, Validators.maxLength(100)]],
        phoneNumber: ['', [Validators.maxLength(30)]],
        website: ['', [Validators.maxLength(200)]],
        streetAddress: ['', [Validators.maxLength(200)]],
        city: ['', [Validators.maxLength(100)]],
        postalCode: ['', [Validators.maxLength(20)]],
        country: ['', [Validators.maxLength(100)]],
        latitude: [null],
        longitude: [null],
        logoUrl: ['', [Validators.maxLength(500)]],
        coverImageUrl: ['', [Validators.maxLength(500)]],
        currency: ['', [Validators.maxLength(3), Validators.pattern(/^[A-Za-z]{0,3}$/)]],
        timeZone: ['', [Validators.maxLength(50)]],
        cuisine: ['', [Validators.maxLength(100)]],
        taxId: ['', [Validators.maxLength(50)]],
        isActive: [true],
    });

    createForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(150)]],
        slug: ['', [Validators.maxLength(100), Validators.pattern(/^[a-z0-9-]*$/)]],
        description: ['', [Validators.maxLength(1000)]],
        email: ['', [Validators.email, Validators.maxLength(100)]],
        phoneNumber: ['', [Validators.maxLength(30)]],
        website: ['', [Validators.maxLength(200)]],
        streetAddress: ['', [Validators.maxLength(200)]],
        city: ['', [Validators.maxLength(100)]],
        postalCode: ['', [Validators.maxLength(20)]],
        country: ['', [Validators.maxLength(100)]],
        latitude: [null],
        longitude: [null],
        logoUrl: ['', [Validators.maxLength(500)]],
        coverImageUrl: ['', [Validators.maxLength(500)]],
        currency: ['', [Validators.maxLength(3), Validators.pattern(/^[A-Za-z]{0,3}$/)]],
        timeZone: ['', [Validators.maxLength(50)]],
        cuisine: ['', [Validators.maxLength(100)]],
        taxId: ['', [Validators.maxLength(50)]],
    });

    ngOnInit(): void {
        this.referenceService.getCurrencies().subscribe();
        this.referenceService.getTimezones().subscribe();
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

        const query: PagedRestaurantQuery = {
            page: Math.floor(first / rows) + 1,
            pageSize: rows,
            search: this.searchText() || null,
            sortBy: sortField,
            sortDir: sortOrder >= 0 ? 'asc' : 'desc',
            isActive: this.activeFilter(),
        };

        this.loading.set(true);
        this.restaurantService
            .getPaged(query)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.restaurants.set(res.value.items);
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

    setActiveFilter(value: boolean | null): void {
        this.activeFilter.set(value);
        this.reload();
    }

    private reload(): void {
        if (this.currentLazy) this.currentLazy = { ...this.currentLazy, first: 0 };
        this.fetchPage();
    }

    load(): void {
        this.fetchPage();
    }

    openCreate(): void {
        this.createForm.reset({
            name: '',
            slug: '',
            description: '',
            email: '',
            phoneNumber: '',
            website: '',
            streetAddress: '',
            city: '',
            postalCode: '',
            country: '',
            latitude: null,
            longitude: null,
            logoUrl: '',
            coverImageUrl: '',
            currency: '',
            timeZone: '',
            cuisine: '',
            taxId: '',
        });
        this.createDialogVisible.set(true);
    }

    closeCreate(): void {
        this.createDialogVisible.set(false);
    }

    createRestaurant(): void {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        const v = this.createForm.value;
        const data: CreateRestaurantDTO = {
            name: v.name.trim(),
            slug: this.trimOrNull(v.slug),
            description: this.trimOrNull(v.description),
            email: this.trimOrNull(v.email),
            phoneNumber: this.trimOrNull(v.phoneNumber),
            website: this.trimOrNull(v.website),
            streetAddress: this.trimOrNull(v.streetAddress),
            city: this.trimOrNull(v.city),
            postalCode: this.trimOrNull(v.postalCode),
            country: this.trimOrNull(v.country),
            latitude: this.numOrNull(v.latitude),
            longitude: this.numOrNull(v.longitude),
            logoUrl: this.trimOrNull(v.logoUrl),
            coverImageUrl: this.trimOrNull(v.coverImageUrl),
            currency: v.currency ? v.currency.trim().toUpperCase() : null,
            timeZone: this.trimOrNull(v.timeZone),
            cuisine: this.trimOrNull(v.cuisine),
            openingHours: null,
            taxId: this.trimOrNull(v.taxId),
        };

        this.loadingService.start(CREATE_RESTAURANT_KEY);
        this.restaurantService
            .create(data)
            .pipe(finalize(() => this.loadingService.stop(CREATE_RESTAURANT_KEY)))
            .subscribe({
                next: (res: Result<RestaurantDTO>) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Restaurant created',
                            detail: `${res.value.name} was created.`,
                            life: 3000,
                        });
                        this.closeCreate();
                        this.load();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not create restaurant',
                            life: 3000,
                        });
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not create restaurant',
                        life: 3000,
                    });
                },
            });
    }

    openEdit(restaurant: RestaurantDTO): void {
        this.editing = restaurant;
        this.allowRename = true;
        this.editForm.reset({
            name: restaurant.name,
            description: restaurant.description ?? '',
            email: restaurant.email ?? '',
            phoneNumber: restaurant.phoneNumber ?? '',
            website: restaurant.website ?? '',
            streetAddress: restaurant.streetAddress ?? '',
            city: restaurant.city ?? '',
            postalCode: restaurant.postalCode ?? '',
            country: restaurant.country ?? '',
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            logoUrl: restaurant.logoUrl ?? '',
            coverImageUrl: restaurant.coverImageUrl ?? '',
            currency: restaurant.currency ?? '',
            timeZone: restaurant.timeZone ?? '',
            cuisine: restaurant.cuisine ?? '',
            taxId: restaurant.taxId ?? '',
            isActive: restaurant.isActive,
        });
        if (!this.allowRename) this.editForm.get('name')?.disable();
        else this.editForm.get('name')?.enable();
        this.hoursDays.set(this.makeDefaultHours());
        this.loadHours(restaurant.id);
        this.dialogVisible.set(true);
    }

    private loadHours(restaurantId: number): void {
        this.restaurantService.getOpeningHours(restaurantId).subscribe({
            next: (res) => {
                if (!res.isSuccess) return;
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
            },
        });
    }

    protected saveOpeningHours(): void {
        if (!this.editing) return;
        const payload: UpdateOpeningHoursDTO = {
            days: this.hoursDays().map((d) => ({
                dayOfWeek: d.dayOfWeek,
                isOpen: d.isOpen,
                openTime: d.isOpen ? d.openTime || '09:00' : null,
                closeTime: d.isOpen ? d.closeTime || '17:00' : null,
            })),
        };
        this.loadingService.start(SAVE_HOURS_KEY);
        this.restaurantService
            .saveOpeningHours(this.editing.id, payload)
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
                            detail: res.error ?? 'Could not save hours',
                            life: 3000,
                        });
                    }
                },
            });
    }

    protected openPublicRestaurant(restaurant: RestaurantDTO): void {
        this.router.navigate(['/r', restaurant.slug]);
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
        const payload: UpdateRestaurantDTO = {
            name: this.allowRename ? v.name?.trim() : null,
            description: this.trimOrNull(v.description),
            email: this.trimOrNull(v.email),
            phoneNumber: this.trimOrNull(v.phoneNumber),
            website: this.trimOrNull(v.website),
            streetAddress: this.trimOrNull(v.streetAddress),
            city: this.trimOrNull(v.city),
            postalCode: this.trimOrNull(v.postalCode),
            country: this.trimOrNull(v.country),
            latitude: this.numOrNull(v.latitude),
            longitude: this.numOrNull(v.longitude),
            logoUrl: this.trimOrNull(v.logoUrl),
            coverImageUrl: this.trimOrNull(v.coverImageUrl),
            currency: v.currency ? v.currency.trim().toUpperCase() : null,
            timeZone: this.trimOrNull(v.timeZone),
            cuisine: this.trimOrNull(v.cuisine),
            openingHours: null,
            taxId: this.trimOrNull(v.taxId),
            isActive: v.isActive,
        };

        this.loadingService.start(UPDATE_RESTAURANT_KEY);
        this.restaurantService
            .update(this.editing.id, payload)
            .pipe(finalize(() => this.loadingService.stop(UPDATE_RESTAURANT_KEY)))
            .subscribe({
                next: (res: Result<RestaurantDTO>) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Updated',
                            detail: `${res.value.name} saved.`,
                            life: 2500,
                        });
                        this.close();
                        this.load();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not update restaurant',
                            life: 3000,
                        });
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not update restaurant',
                        life: 3000,
                    });
                },
            });
    }

    isInvalid(form: FormGroup, controlName: string): boolean {
        const control = form.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    getErrorMessage(form: FormGroup, controlName: string): string {
        const control = form.get(controlName);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        if (control.errors['email']) return 'Enter a valid email';
        if (control.errors['maxlength']) {
            return `Maximum ${control.errors['maxlength'].requiredLength} characters`;
        }
        if (control.errors['pattern']) {
            if (controlName === 'slug') return 'Lowercase letters, numbers and dashes only';
            if (controlName === 'currency') return '3-letter currency code (e.g. EUR)';
            return 'Invalid format';
        }
        return '';
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
