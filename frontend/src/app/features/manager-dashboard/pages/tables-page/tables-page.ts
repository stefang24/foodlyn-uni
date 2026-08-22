import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NotifyService } from '../../../../shared/services/notify.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { TableService } from '../../../../shared/services/table.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { QrLabelPrintService } from '../../../../shared/services/qr-label-print.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ROLES } from '../../../../core/constants/roles.constant';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';
import { Result } from '../../../../shared/models/result.model';
import {
    BulkCreateRestaurantTablesDTO,
    CreateRestaurantTableDTO,
    RestaurantTableDTO,
    RestaurantTableStatus,
    UpdateRestaurantTableDTO,
} from '../../../../shared/models/tableDTO.model';
const SAVE_TABLE_KEY = 'saveTable';
const BULK_TABLE_KEY = 'bulkTable';

@Component({
    selector: 'app-tables-page',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        TextareaModule,
        ToggleSwitchModule,
        ConfirmDialogModule,
    ],
    templateUrl: './tables-page.html',
    styleUrl: './tables-page.scss',
    providers: [ConfirmationService],
})
export class TablesPage implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly tableService: TableService = inject(TableService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly qrLabelPrint = inject(QrLabelPrintService);
    private readonly auth = inject(AuthService);
    private readonly messageService = inject(NotifyService);
    private readonly confirmationService = inject(ConfirmationService);
    protected readonly loadingService: LoadingService = inject(LoadingService);

    protected readonly isAdmin = this.auth.currentUser()?.role === ROLES.SUPER_ADMIN;

    protected readonly SAVE_TABLE_KEY = SAVE_TABLE_KEY;
    protected readonly BULK_TABLE_KEY = BULK_TABLE_KEY;

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly restaurantOptions = computed(() =>
        this.restaurants().map((r) => ({ label: r.name, value: r.id })),
    );
    protected readonly selectedRestaurantId = signal<number | null>(null);
    protected readonly tables = signal<RestaurantTableDTO[]>([]);
    protected readonly loadingTables = signal(false);
    protected readonly editMode = signal(false);

    protected readonly tableDialog = signal(false);
    protected readonly bulkDialog = signal(false);
    protected readonly qrDialog = signal(false);
    protected readonly qrTable = signal<RestaurantTableDTO | null>(null);

    protected editingTable: RestaurantTableDTO | null = null;

    private tableStatusSub: Subscription | null = null;
    private joinedRestaurantId: number | null = null;

    protected readonly statusOptions: { label: string; value: RestaurantTableStatus }[] = [
        { label: 'Free', value: 'Free' },
        { label: 'Occupied', value: 'Occupied' },
        { label: 'Reserved', value: 'Reserved' },
        { label: 'Cleaning', value: 'Cleaning' },
        { label: 'Out of service', value: 'OutOfService' },
    ];

    tableForm: FormGroup = this.fb.group({
        number: [1, [Validators.required, Validators.min(1)]],
        label: ['', [Validators.maxLength(100)]],
        capacity: [2, [Validators.required, Validators.min(1), Validators.max(50)]],
        location: ['', [Validators.maxLength(200)]],
        notes: ['', [Validators.maxLength(1000)]],
        status: ['Free' as RestaurantTableStatus, [Validators.required]],
        currentPartySize: [0, [Validators.min(0), Validators.max(50)]],
        isActive: [true],
    });

    bulkForm: FormGroup = this.fb.group({
        count: [10, [Validators.required, Validators.min(1), Validators.max(200)]],
        startingNumber: [0, [Validators.min(0)]],
        capacity: [2, [Validators.required, Validators.min(1), Validators.max(50)]],
        location: ['', [Validators.maxLength(200)]],
    });

    ngOnInit(): void {
        this.loadRestaurants();
        this.tableStatusSub = this.realtime.tableStatusChanged$.subscribe((u) => {
            this.tables.update((list) =>
                list.map((t) =>
                    t.id === u.id
                        ? { ...t, status: u.status as RestaurantTableStatus, currentPartySize: u.currentPartySize }
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

    private loadRestaurants(): void {
        const list$ = this.isAdmin
            ? this.restaurantService.getAll()
            : this.restaurantService.getMine();
        list$.subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.restaurants.set(res.value);
                    if (res.value.length > 0 && this.selectedRestaurantId() === null) {
                        this.selectedRestaurantId.set(res.value[0].id);
                        this.loadTables(res.value[0].id);
                        this.joinManagerGroup(res.value[0].id);
                    }
                }
            },
        });
    }

    protected onRestaurantChange(id: number | null): void {
        this.selectedRestaurantId.set(id);
        this.tables.set([]);
        if (id != null) {
            this.loadTables(id);
            this.joinManagerGroup(id);
        }
    }

    protected toggleEditMode(): void {
        this.editMode.update((v) => !v);
    }

    protected canEdit(t: RestaurantTableDTO): boolean {
        if (!this.editMode()) return false;
        return this.isAdmin || t.status === 'Free';
    }

    protected editLockTitle(t: RestaurantTableDTO, action: string): string {
        if (this.isAdmin) return action;
        return t.status !== 'Free' ? `Only free tables can be ${action.toLowerCase()}` : action;
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

    private loadTables(restaurantId: number): void {
        this.loadingTables.set(true);
        this.tableService
            .getByRestaurant(restaurantId)
            .pipe(finalize(() => this.loadingTables.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.tables.set(
                            [...res.value].sort((a, b) => a.number - b.number),
                        );
                    }
                },
            });
    }

    protected openCreateTable(): void {
        this.editingTable = null;
        const next = (this.tables().reduce((m, t) => Math.max(m, t.number), 0) || 0) + 1;
        this.tableForm.reset({
            number: next,
            label: '',
            capacity: 2,
            location: '',
            notes: '',
            status: 'Free',
            currentPartySize: 0,
            isActive: true,
        });
        this.tableDialog.set(true);
    }

    protected openEditTable(t: RestaurantTableDTO): void {
        this.editingTable = t;
        this.tableForm.reset({
            number: t.number,
            label: t.label ?? '',
            capacity: t.capacity,
            location: t.location ?? '',
            notes: t.notes ?? '',
            status: t.status,
            currentPartySize: t.currentPartySize,
            isActive: t.isActive,
        });
        this.tableDialog.set(true);
    }

    protected saveTable(): void {
        if (this.tableForm.invalid) {
            this.tableForm.markAllAsTouched();
            return;
        }
        const restaurantId = this.selectedRestaurantId();
        if (restaurantId == null) return;

        const v = this.tableForm.value;
        this.loadingService.start(SAVE_TABLE_KEY);
        const stop = () => this.loadingService.stop(SAVE_TABLE_KEY);

        if (this.editingTable) {
            const payload: UpdateRestaurantTableDTO = {
                number: Number(v.number) || 1,
                label: this.trimOrNull(v.label),
                capacity: Number(v.capacity) || 1,
                location: this.trimOrNull(v.location),
                notes: this.trimOrNull(v.notes),
                status: v.status,
                currentPartySize: Number(v.currentPartySize) || 0,
                isActive: !!v.isActive,
            };

            this.tableService
                .update(this.editingTable.id, payload)
                .pipe(finalize(stop))
                .subscribe({
                    next: (res) => this.onSaved(res, 'Table updated'),
                    error: (err) => this.errorToast(err, 'Could not update table'),
                });
        } else {
            const payload: CreateRestaurantTableDTO = {
                restaurantId,
                number: Number(v.number) || 1,
                label: this.trimOrNull(v.label),
                capacity: Number(v.capacity) || 1,
                location: this.trimOrNull(v.location),
                notes: this.trimOrNull(v.notes),
                isActive: !!v.isActive,
            };

            this.tableService
                .create(payload)
                .pipe(finalize(stop))
                .subscribe({
                    next: (res) => this.onSaved(res, 'Table created'),
                    error: (err) => this.errorToast(err, 'Could not create table'),
                });
        }
    }

    private onSaved(res: Result<RestaurantTableDTO>, title: string): void {
        if (res.isSuccess) {
            this.messageService.add({
                severity: 'success',
                summary: title,
                detail: `Table #${res.value.number}`,
                life: 2500,
            });
            this.tableDialog.set(false);
            const rId = this.selectedRestaurantId();
            if (rId != null) this.loadTables(rId);
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: res.error ?? title,
                life: 3000,
            });
        }
    }

    protected deleteTable(t: RestaurantTableDTO): void {
        this.confirmationService.confirm({
            header: 'Delete table?',
            message: `Delete table #${t.number}?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.tableService.delete(t.id).subscribe({
                    next: (res) => {
                        if (res.isSuccess) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Table deleted',
                                life: 2000,
                            });
                            const rId = this.selectedRestaurantId();
                            if (rId != null) this.loadTables(rId);
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
            },
        });
    }

    protected openBulk(): void {
        const next = (this.tables().reduce((m, t) => Math.max(m, t.number), 0) || 0) + 1;
        this.bulkForm.reset({
            count: 10,
            startingNumber: next,
            capacity: 2,
            location: '',
        });
        this.bulkDialog.set(true);
    }

    protected saveBulk(): void {
        if (this.bulkForm.invalid) {
            this.bulkForm.markAllAsTouched();
            return;
        }
        const restaurantId = this.selectedRestaurantId();
        if (restaurantId == null) return;

        const v = this.bulkForm.value;
        const payload: BulkCreateRestaurantTablesDTO = {
            restaurantId,
            count: Number(v.count) || 1,
            startingNumber: Number(v.startingNumber) || 0,
            capacity: Number(v.capacity) || 1,
            location: this.trimOrNull(v.location),
        };

        this.loadingService.start(BULK_TABLE_KEY);
        this.tableService
            .bulkCreate(payload)
            .pipe(finalize(() => this.loadingService.stop(BULK_TABLE_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Tables created',
                            detail: `${res.value.length} added`,
                            life: 2500,
                        });
                        this.bulkDialog.set(false);
                        this.loadTables(restaurantId);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not create tables',
                            life: 3000,
                        });
                    }
                },
                error: (err) => this.errorToast(err, 'Could not create tables'),
            });
    }

    protected rotateToken(t: RestaurantTableDTO): void {
        this.confirmationService.confirm({
            header: 'Rotate QR token?',
            message: `The previous QR code for table #${t.number} will stop working.`,
            icon: 'pi pi-refresh',
            accept: () => {
                this.tableService.rotateToken(t.id).subscribe({
                    next: (res) => {
                        if (res.isSuccess) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'QR token rotated',
                                life: 2000,
                            });
                            const rId = this.selectedRestaurantId();
                            if (rId != null) this.loadTables(rId);
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
            },
        });
    }

    protected openQr(t: RestaurantTableDTO): void {
        this.qrTable.set(t);
        this.qrDialog.set(true);
    }

    protected qrUrl(token: string): string {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/t/${token}`;
    }

    protected qrImageUrl(token: string): string {
        const target = encodeURIComponent(this.qrUrl(token));
        return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${target}`;
    }

    protected canPrintLabels(): boolean {
        return this.tables().some((t) => t.isActive);
    }

    protected printQrLabels(): void {
        const restaurant = this.restaurants().find((r) => r.id === this.selectedRestaurantId());
        if (!restaurant) return;
        this.qrLabelPrint.print(restaurant, this.tables());
    }

    protected copyLink(token: string): void {
        const url = this.qrUrl(token);

            navigator.clipboard.writeText(url).then(() => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Link copied',
                    detail: url,
                    life: 2000,
                });
            });
    }

    protected statusLabel(status: RestaurantTableStatus): string {
        return this.statusOptions.find((o) => o.value === status)?.label ?? status;
    }

    protected isInvalid(form: FormGroup, controlName: string): boolean {
        const control = form.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    private errorToast(err: HttpErrorResponse, fallback: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.error ?? fallback,
            life: 3000,
        });
    }

    private trimOrNull(value: string | null | undefined): string | null {
        if (value === null || value === undefined) return null;
        const trimmed = value.trim();
        return trimmed.length === 0 ? null : trimmed;
    }
}
