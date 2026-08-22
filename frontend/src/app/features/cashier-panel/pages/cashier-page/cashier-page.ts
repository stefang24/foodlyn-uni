import { CurrencyPipe, DatePipe } from '@angular/common';
import { NotifyService } from '../../../../shared/services/notify.service';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../../../shared/services/auth.service';
import { OrderService } from '../../../../shared/services/order.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { SoundService } from '../../../../shared/services/sound.service';
import { TableService, TableStatusDTO } from '../../../../shared/services/table.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { OrderDTO, OrderStatus } from '../../../../shared/models/orderDTO.model';
import { OrderDetailDialog } from '../../../../shared/components/order-detail-dialog/order-detail-dialog';

const LOAD_KEY = 'cashierQueue';
const TABLES_KEY = 'cashierTables';
const HISTORY_KEY = 'cashierHistory';

type Tab = 'orders' | 'awaiting-payment' | 'tables' | 'history';

@Component({
    selector: 'app-cashier-page',
    imports: [DialogModule, FormsModule, CurrencyPipe, DatePipe, RouterLink, OrderDetailDialog],
    templateUrl: './cashier-page.html',
    styleUrl: './cashier-page.scss',
})
export class CashierPage implements OnInit, OnDestroy {
    private readonly auth = inject(AuthService);
    private readonly orderService = inject(OrderService);
    private readonly realtime = inject(OrderRealtimeService);
    protected readonly sound = inject(SoundService);
    private readonly tableService = inject(TableService);
    private readonly messageService = inject(NotifyService);
    protected readonly loadingService = inject(LoadingService);

    protected readonly LOAD_KEY = LOAD_KEY;
    protected readonly TABLES_KEY = TABLES_KEY;
    protected readonly HISTORY_KEY = HISTORY_KEY;

    protected readonly tab = signal<Tab>('orders');
    protected readonly orders = signal<OrderDTO[]>([]);
    protected readonly awaitingPayment = signal<OrderDTO[]>([]);
    protected readonly history = signal<OrderDTO[]>([]);
    protected readonly tables = signal<TableStatusDTO[]>([]);

    protected readonly rejectOpen = signal(false);
    protected readonly rejectTarget = signal<OrderDTO | null>(null);
    protected rejectReason = '';

    protected readonly detailOpen = signal(false);
    protected readonly detailOrderId = signal<number | null>(null);
    protected readonly detailSeed = signal<OrderDTO | null>(null);

    openDetail(o: OrderDTO): void {
        this.detailSeed.set(o);
        this.detailOrderId.set(o.id);
        this.detailOpen.set(true);
    }

    closeDetail(): void {
        this.detailOpen.set(false);
        this.detailOrderId.set(null);
        this.detailSeed.set(null);
    }

    protected readonly pending = computed(() =>
        this.orders().filter((o) => o.status === 'Placed'),
    );
    protected readonly activeCount = computed(() => this.orders().length);
    protected readonly awaitingCount = computed(() => this.awaitingPayment().length);

    private createdSub: Subscription | null = null;
    private updatedSub: Subscription | null = null;
    private removedSub: Subscription | null = null;
    private tableStatusSub: Subscription | null = null;
    private reconnectedSub: Subscription | null = null;
    private restaurantId = 0;

    async ngOnInit(): Promise<void> {
        const rId = this.auth.currentUser()?.restaurantId;
        if (!rId) {
            this.messageService.add({
                severity: 'error',
                summary: 'No restaurant',
                detail: 'Your account has no restaurant assigned.',
                life: 3000,
            });
            return;
        }
        this.restaurantId = rId;

        this.createdSub = this.realtime.created$.subscribe((o) => {
            let isNew = false;
            this.orders.update((list) => {
                if (list.some((x) => x.id === o.id)) return list;
                isNew = true;
                return [o, ...list];
            });
            if (isNew && o.status === 'Placed') this.sound.playNewOrder();
            this.refreshTablesSoft();
        });
        this.updatedSub = this.realtime.updated$.subscribe((o) => {
            if (o.status === 'AwaitingPayment') {
                this.orders.update((list) => list.filter((x) => x.id !== o.id));
                this.awaitingPayment.update((list) =>
                    list.some((x) => x.id === o.id)
                        ? list.map((x) => (x.id === o.id ? o : x))
                        : [o, ...list],
                );
            } else if (o.status === 'Completed') {
                this.orders.update((list) => list.filter((x) => x.id !== o.id));
                this.awaitingPayment.update((list) => list.filter((x) => x.id !== o.id));
            } else {
                this.orders.update((list) => list.map((x) => (x.id === o.id ? o : x)));
            }
            this.refreshTablesSoft();
        });
        this.removedSub = this.realtime.removed$.subscribe((id) => {
            this.orders.update((list) => list.filter((x) => x.id !== id));
            this.awaitingPayment.update((list) => list.filter((x) => x.id !== id));
            this.refreshTablesSoft();
        });
        this.tableStatusSub = this.realtime.tableStatusChanged$.subscribe((u) => {
            this.tables.update((list) =>
                list.map((t) =>
                    t.id === u.id
                        ? { ...t, status: u.status, currentPartySize: u.currentPartySize }
                        : t,
                ),
            );
        });
        this.reconnectedSub = this.realtime.reconnected$.subscribe(() => {
            this.loadOrders();
            this.loadAwaiting();
            this.refreshTablesSoft();
        });

        try {
            await this.realtime.joinStaff('cashier', rId);
        } catch {
        }

        this.loadOrders();
        this.loadAwaiting();
    }

    async ngOnDestroy(): Promise<void> {
        this.createdSub?.unsubscribe();
        this.updatedSub?.unsubscribe();
        this.removedSub?.unsubscribe();
        this.tableStatusSub?.unsubscribe();
        this.reconnectedSub?.unsubscribe();
        if (this.restaurantId) {
            await this.realtime.leaveStaff('cashier', this.restaurantId);
        }
    }

    protected setTab(t: Tab): void {
        this.tab.set(t);
        if (t === 'tables') this.loadTables();
        if (t === 'awaiting-payment') this.loadAwaiting();
        if (t === 'history') this.loadHistory();
    }

    protected markPaid(o: OrderDTO): void {
        this.orderService.markPaid(o.id).subscribe({
            next: (res) => {
                if (!res.isSuccess) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Mark paid failed',
                        life: 3000,
                    });
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Mark paid failed',
                    life: 3000,
                }),
        });
    }

    protected statusClass(s: OrderStatus): string {
        return 's-' + s.toLowerCase();
    }

    protected tableStateClass(t: TableStatusDTO): string {
        if (t.activeOrders > 0) return 'busy';
        if (t.status === 'Eating') return 'eating';
        if (t.status === 'Cleaning') return 'cleaning';
        if (t.status === 'Occupied' || t.currentPartySize > 0) return 'occupied';
        if (t.status === 'Reserved') return 'reserved';
        if (t.status === 'OutOfService') return 'off';
        return 'free';
    }

    protected tableStateLabel(t: TableStatusDTO): string {
        if (t.activeOrders > 0) return `Active · ${t.latestOrderStatus ?? ''}`;
        if (t.status === 'Eating') return 'Eating';
        if (t.status === 'Cleaning') return 'Cleaning';
        if (t.status === 'Occupied') return 'Occupied';
        if (t.status === 'Reserved') return 'Reserved';
        if (t.status === 'OutOfService') return 'Out of service';
        return 'Free';
    }

    protected markCleaned(t: TableStatusDTO): void {
        this.tableService.markCleaned(t.id).subscribe({
            next: (res) => {
                if (!res.isSuccess) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not mark cleaned',
                        life: 3000,
                    });
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Could not mark cleaned',
                    life: 3000,
                }),
        });
    }

    protected finishEating(t: TableStatusDTO): void {
        this.tableService.finishEating(t.id).subscribe({
            next: (res) => {
                if (!res.isSuccess) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not finish eating',
                        life: 3000,
                    });
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Could not finish eating',
                    life: 3000,
                }),
        });
    }

    protected approve(o: OrderDTO): void {
        this.orderService.approve(o.id).subscribe({
            next: (res) => {
                if (!res.isSuccess) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Approve failed',
                        life: 3000,
                    });
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Approve failed',
                    life: 3000,
                }),
        });
    }

    protected openReject(o: OrderDTO): void {
        this.rejectTarget.set(o);
        this.rejectReason = '';
        this.rejectOpen.set(true);
    }

    protected confirmReject(): void {
        const target = this.rejectTarget();
        if (!target) return;
        const reason = this.rejectReason.trim() || null;
        this.orderService.reject(target.id, { reason }).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.rejectOpen.set(false);
                    this.rejectTarget.set(null);
                    this.rejectReason = '';
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Reject failed',
                        life: 3000,
                    });
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Reject failed',
                    life: 3000,
                }),
        });
    }

    protected closeReject(): void {
        this.rejectOpen.set(false);
        this.rejectTarget.set(null);
        this.rejectReason = '';
    }

    private loadOrders(): void {
        if (!this.restaurantId) return;
        this.loadingService.start(LOAD_KEY);
        this.orderService
            .getCashierQueue(this.restaurantId)
            .pipe(finalize(() => this.loadingService.stop(LOAD_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) this.orders.set(res.value);
                },
            });
    }

    private loadTables(): void {
        if (!this.restaurantId) return;
        this.loadingService.start(TABLES_KEY);
        this.tableService
            .getStatus(this.restaurantId)
            .pipe(finalize(() => this.loadingService.stop(TABLES_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) this.tables.set(res.value);
                },
            });
    }

    private loadAwaiting(): void {
        if (!this.restaurantId) return;
        this.orderService.getAwaitingPayment(this.restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) this.awaitingPayment.set(res.value);
            },
        });
    }

    private loadHistory(): void {
        if (!this.restaurantId) return;
        this.loadingService.start(HISTORY_KEY);
        this.orderService
            .getHistory(this.restaurantId, 500)
            .pipe(finalize(() => this.loadingService.stop(HISTORY_KEY)))
            .subscribe({
                next: (res) => {
                    if (!res.isSuccess) return;
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    const today = res.value.filter(
                        (o) => new Date(o.createdAt).getTime() >= startOfDay.getTime(),
                    );
                    this.history.set(today);
                },
            });
    }

    private refreshTablesSoft(): void {
        if (!this.restaurantId) return;
        this.tableService.getStatus(this.restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) this.tables.set(res.value);
            },
        });
    }
}
