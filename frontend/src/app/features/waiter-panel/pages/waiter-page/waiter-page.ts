import { CurrencyPipe, DatePipe } from '@angular/common';
import { NotifyService } from '../../../../shared/services/notify.service';
import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription, finalize, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../shared/services/auth.service';
import { OrderService } from '../../../../shared/services/order.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { SoundService } from '../../../../shared/services/sound.service';
import { TableService, TableStatusDTO, TableCallDTO } from '../../../../shared/services/table.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { OrderDTO } from '../../../../shared/models/orderDTO.model';
import { OrderDetailDialog } from '../../../../shared/components/order-detail-dialog/order-detail-dialog';

const LOAD_KEY = 'waiterQueue';
const TABLES_KEY = 'waiterTables';
const CALLS_KEY = 'waiterCalls';

type Tab = 'ready' | 'preparing' | 'tables' | 'calls';

@Component({
    selector: 'app-waiter-page',
    imports: [CurrencyPipe, DatePipe, RouterLink, OrderDetailDialog],
    templateUrl: './waiter-page.html',
    styleUrl: './waiter-page.scss',
})
export class WaiterPage implements OnInit, OnDestroy {
    private readonly auth = inject(AuthService);
    private readonly orderService = inject(OrderService);
    private readonly realtime = inject(OrderRealtimeService);
    protected readonly sound = inject(SoundService);
    private readonly tableService = inject(TableService);
    private readonly messageService = inject(NotifyService);
    private readonly destroyRef = inject(DestroyRef);
    protected readonly loadingService = inject(LoadingService);

    protected readonly LOAD_KEY = LOAD_KEY;
    protected readonly TABLES_KEY = TABLES_KEY;
    protected readonly CALLS_KEY = CALLS_KEY;

    protected readonly tab = signal<Tab>('ready');
    protected readonly orders = signal<OrderDTO[]>([]);
    protected readonly tables = signal<TableStatusDTO[]>([]);
    protected readonly calls = signal<TableCallDTO[]>([]);
    protected readonly now = signal(Date.now());

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

    protected readonly ready = computed(() =>
        this.orders().filter((o) => o.status === 'Ready'),
    );
    protected readonly preparing = computed(() =>
        this.orders().filter((o) => o.status === 'Preparing'),
    );
    protected readonly readyCount = computed(() => this.ready().length);
    protected readonly preparingCount = computed(() => this.preparing().length);
    protected readonly callsCount = computed(() => this.calls().length);

    private createdSub: Subscription | null = null;
    private updatedSub: Subscription | null = null;
    private removedSub: Subscription | null = null;
    private callSub: Subscription | null = null;
    private callRemovedSub: Subscription | null = null;
    private tableStatusSub: Subscription | null = null;
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
            if (isNew && o.status === 'Ready') this.sound.playOrderReady();
            this.refreshTablesSoft();
        });
        this.updatedSub = this.realtime.updated$.subscribe((o) => {
            let becameReady = false;
            this.orders.update((list) => {
                const prev = list.find((x) => x.id === o.id);
                if (prev && prev.status !== 'Ready' && o.status === 'Ready') {
                    becameReady = true;
                }
                return list.map((x) => (x.id === o.id ? o : x));
            });
            if (becameReady) this.sound.playOrderReady();
            this.refreshTablesSoft();
        });
        this.removedSub = this.realtime.removed$.subscribe((id) => {
            this.orders.update((list) => list.filter((x) => x.id !== id));
            this.refreshTablesSoft();
        });
        this.callSub = this.realtime.waiterCalled$.subscribe((c) => {
            let isNew = false;
            this.calls.update((list) => {
                if (list.some((x) => x.id === c.id)) return list;
                isNew = true;
                return [c, ...list];
            });
            if (isNew) {
                this.sound.playWaiterCall();
                this.messageService.add({
                    severity: 'info',
                    summary: `Table #${c.tableNumber} calling`,
                    detail: c.message ?? 'Guest needs assistance',
                    life: 4000,
                });
            }
        });
        this.callRemovedSub = this.realtime.waiterCallRemoved$.subscribe((id) => {
            this.calls.update((list) => list.filter((x) => x.id !== id));
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

        interval(500)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.now.set(Date.now()));

        this.realtime.reconnected$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.loadOrders();
                this.loadCalls();
                this.loadTables();
            });

        try {
            await this.realtime.joinStaff('waiter', rId);
        } catch {
        }

        this.loadOrders();
        this.loadCalls();
        this.loadTables();
    }

    protected remainingLabel(o: OrderDTO): string {
        if (!o.preparingStartedAt || !o.prepTimeMinutes) return '--:--';
        const start = Date.parse(o.preparingStartedAt);
        const totalMs = o.prepTimeMinutes * 60 * 1000;
        const remainingMs = Math.max(0, start + totalMs - this.now());
        if (remainingMs === 0) return 'Soon';
        const m = Math.floor(remainingMs / 60000);
        const s = Math.floor((remainingMs % 60000) / 1000);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    protected progressPct(o: OrderDTO): number {
        if (!o.preparingStartedAt || !o.prepTimeMinutes) return 0;
        const start = Date.parse(o.preparingStartedAt);
        const totalMs = o.prepTimeMinutes * 60 * 1000;
        const elapsed = this.now() - start;
        return Math.max(0, Math.min(100, (elapsed / totalMs) * 100));
    }

    async ngOnDestroy(): Promise<void> {
        this.createdSub?.unsubscribe();
        this.updatedSub?.unsubscribe();
        this.removedSub?.unsubscribe();
        this.callSub?.unsubscribe();
        this.callRemovedSub?.unsubscribe();
        this.tableStatusSub?.unsubscribe();
        if (this.restaurantId) {
            await this.realtime.leaveStaff('waiter', this.restaurantId);
        }
    }

    protected setTab(t: Tab): void {
        this.tab.set(t);
        if (t === 'tables') this.loadTables();
        if (t === 'calls') this.loadCalls();
    }

    protected markServed(o: OrderDTO): void {
        this.orderService.markServed(o.id).subscribe({
            next: (res) => {
                if (!res.isSuccess) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Serve failed',
                        life: 3000,
                    });
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Serve failed',
                    life: 3000,
                }),
        });
    }

    protected acknowledgeCall(c: TableCallDTO): void {
        this.tableService.acknowledgeCall(c.id, this.restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.calls.update((list) => list.filter((x) => x.id !== c.id));
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not acknowledge',
                        life: 3000,
                    });
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Could not acknowledge',
                    life: 3000,
                }),
        });
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

    private refreshTablesSoft(): void {
        if (!this.restaurantId) return;
        this.tableService.getStatus(this.restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) this.tables.set(res.value);
            },
        });
    }

    private loadOrders(): void {
        if (!this.restaurantId) return;
        this.loadingService.start(LOAD_KEY);
        this.orderService
            .getWaiterQueue(this.restaurantId)
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

    private loadCalls(): void {
        if (!this.restaurantId) return;
        this.loadingService.start(CALLS_KEY);
        this.tableService
            .getCalls(this.restaurantId)
            .pipe(finalize(() => this.loadingService.stop(CALLS_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) this.calls.set(res.value);
                },
            });
    }
}
