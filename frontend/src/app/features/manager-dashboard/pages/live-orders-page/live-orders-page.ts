import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NotifyService } from '../../../../shared/services/notify.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SelectModule } from 'primeng/select';
import { OrderService } from '../../../../shared/services/order.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { ReferenceService } from '../../../../shared/services/reference.service';
import { OrderDTO } from '../../../../shared/models/orderDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';
import { OrderDetailDialog } from '../../../../shared/components/order-detail-dialog/order-detail-dialog';

const DISPLAY_CURRENCY_KEY = 'foodlyn_display_currency';

@Component({
    selector: 'app-manager-live-orders-page',
    imports: [CurrencyPipe, DatePipe, FormsModule, SelectModule, OrderDetailDialog],
    templateUrl: './live-orders-page.html',
    styleUrl: './live-orders-page.scss',
})
export class LiveOrdersPage implements OnInit, OnDestroy {
    private readonly orderService: OrderService = inject(OrderService);
    private readonly realtime: OrderRealtimeService = inject(OrderRealtimeService);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    protected readonly referenceService = inject(ReferenceService);
    private readonly messageService: NotifyService = inject(NotifyService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly restaurantOptions = computed(() =>
        this.restaurants().map((r) => ({ label: r.name, value: r.id })),
    );
    protected readonly selectedRestaurantId = signal<number | null>(null);
    protected readonly orders = signal<OrderDTO[]>([]);
    protected readonly loading = signal(false);

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

    protected readonly displayCurrency = signal<string>(
        localStorage.getItem(DISPLAY_CURRENCY_KEY) ?? 'EUR',
    );
    protected readonly currencyOptions = computed(() =>
        this.referenceService.currencies().map((c) => ({
            label: `${c.code}${c.symbol ? ' (' + c.symbol + ')' : ''}`,
            value: c.code,
        })),
    );

    protected setDisplayCurrency(code: string): void {
        this.displayCurrency.set(code);
        localStorage.setItem(DISPLAY_CURRENCY_KEY, code);
    }

    protected convertedTotal(o: OrderDTO): number {
        return this.referenceService.convert(
            o.totalAmount ?? 0,
            o.currency ?? 'EUR',
            this.displayCurrency(),
        );
    }

    protected readonly byStatus = computed(() => {
        const map: Record<string, OrderDTO[]> = {
            Placed: [],
            Approved: [],
            Preparing: [],
            Ready: [],
            Served: [],
            AwaitingPayment: [],
        };
        for (const o of this.orders()) {
            if (map[o.status]) map[o.status].push(o);
        }
        return map;
    });

    protected readonly columns: { key: keyof ReturnType<LiveOrdersPage['byStatus']>; label: string; icon: string }[] = [
        { key: 'Placed', label: 'Placed', icon: 'pi-send' },
        { key: 'Approved', label: 'Approved', icon: 'pi-check' },
        { key: 'Preparing', label: 'Preparing', icon: 'pi-clock' },
        { key: 'Ready', label: 'Ready', icon: 'pi-bell' },
        { key: 'Served', label: 'Served', icon: 'pi-flag' },
        { key: 'AwaitingPayment', label: 'To Pay', icon: 'pi-wallet' },
    ];

    private joinedRestaurantId: number | null = null;
    private createdSub: Subscription | null = null;
    private updatedSub: Subscription | null = null;
    private removedSub: Subscription | null = null;

    ngOnInit(): void {
        this.referenceService.getCurrencies().subscribe();
        this.restaurantService.getMine().subscribe({
            next: (res) => {
                if (res.isSuccess && res.value.length > 0) {
                    this.restaurants.set(res.value);
                    this.selectedRestaurantId.set(res.value[0].id);
                    this.load(res.value[0].id);
                    this.joinStaff(res.value[0].id);
                }
            },
        });

        this.createdSub = this.realtime.created$.subscribe((o) => {
            if (!this.selectedRestaurantId() || o.restaurantId !== this.selectedRestaurantId()) return;
            this.orders.update((list) =>
                list.some((x) => x.id === o.id) ? list : [o, ...list],
            );
        });
        this.updatedSub = this.realtime.updated$.subscribe((o) => {
            if (!this.selectedRestaurantId() || o.restaurantId !== this.selectedRestaurantId()) return;
            const terminal = o.status === 'Completed' || o.status === 'Rejected' || o.status === 'Cancelled';
            if (terminal) {
                this.orders.update((list) => list.filter((x) => x.id !== o.id));
            } else {
                this.orders.update((list) =>
                    list.some((x) => x.id === o.id)
                        ? list.map((x) => (x.id === o.id ? o : x))
                        : [o, ...list],
                );
            }
        });
        this.removedSub = this.realtime.removed$.subscribe((id) => {
            this.orders.update((list) => list.filter((x) => x.id !== id));
        });

        interval(20000)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                const rid = this.selectedRestaurantId();
                if (rid) this.load(rid, true);
            });
    }

    async ngOnDestroy(): Promise<void> {
        this.createdSub?.unsubscribe();
        this.updatedSub?.unsubscribe();
        this.removedSub?.unsubscribe();
        if (this.joinedRestaurantId != null) {
            try {
                await this.realtime.leaveStaff('manager', this.joinedRestaurantId);
            } catch {
            }
        }
    }

    protected onRestaurantChange(id: number | null): void {
        this.selectedRestaurantId.set(id);
        this.orders.set([]);
        if (id != null) {
            this.load(id);
            this.joinStaff(id);
        }
    }

    protected trackOrder(_: number, o: OrderDTO): number {
        return o.id;
    }

    private load(restaurantId: number, silent = false): void {
        if (!silent) this.loading.set(true);
        this.orderService.getLive(restaurantId).subscribe({
            next: (res) => {
                if (!silent) this.loading.set(false);
                if (res.isSuccess) this.orders.set(res.value);
                else if (!silent)
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not load live orders',
                        life: 3000,
                    });
            },
            error: () => {
                if (!silent) this.loading.set(false);
            },
        });
    }

    private async joinStaff(restaurantId: number): Promise<void> {
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
}
