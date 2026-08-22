import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { NotifyService } from '../../../../../shared/services/notify.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SelectModule } from 'primeng/select';
import { OrderService } from '../../../../../shared/services/order.service';
import { Restaurant } from '../../../../../shared/services/restaurant.service';
import { ReferenceService } from '../../../../../shared/services/reference.service';
import { OrderDTO } from '../../../../../shared/models/orderDTO.model';
import { RestaurantDTO } from '../../../../../shared/models/restaurantDTO.model';
import { OrderDetailDialog } from '../../../../../shared/components/order-detail-dialog/order-detail-dialog';

const DISPLAY_CURRENCY_KEY = 'foodlyn_display_currency';

@Component({
    selector: 'app-admin-live-orders',
    imports: [CurrencyPipe, DatePipe, FormsModule, SelectModule, OrderDetailDialog],
    templateUrl: './live-orders.html',
    styleUrl: './live-orders.scss',
})
export class LiveOrders implements OnInit {
    private readonly orderService: OrderService = inject(OrderService);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    protected readonly referenceService = inject(ReferenceService);
    private readonly messageService: NotifyService = inject(NotifyService);
    private readonly destroyRef = inject(DestroyRef);

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

    protected readonly orders = signal<OrderDTO[]>([]);
    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly loading = signal(false);
    protected readonly filterRestaurantId = signal<number | null>(null);
    protected readonly filterStatus = signal<string | null>(null);
    protected readonly query = signal('');

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

    protected readonly restaurantOptions = computed(() => [
        { label: 'All restaurants', value: null as number | null },
        ...this.restaurants().map((r) => ({ label: r.name, value: r.id as number | null })),
    ]);

    protected readonly statusOptions = [
        { label: 'All statuses', value: null as string | null },
        { label: 'Placed', value: 'Placed' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Preparing', value: 'Preparing' },
        { label: 'Ready', value: 'Ready' },
        { label: 'Served', value: 'Served' },
        { label: 'Awaiting payment', value: 'AwaitingPayment' },
    ];

    protected readonly filtered = computed(() => {
        const r = this.filterRestaurantId();
        const s = this.filterStatus();
        const q = this.query().trim().toLowerCase();
        const restaurantNameById = new Map(this.restaurants().map((x) => [x.id, x.name.toLowerCase()]));

        return this.orders().filter((o) => {
            if (r != null && o.restaurantId !== r) return false;
            if (s != null && o.status !== s) return false;
            if (!q) return true;

            if (String(o.id).includes(q)) return true;
            const rname = o.restaurantId != null ? restaurantNameById.get(o.restaurantId) : null;
            if (rname && rname.includes(q)) return true;
            if (o.customerName && o.customerName.toLowerCase().includes(q)) return true;
            if (o.items?.some((i) => i.name.toLowerCase().includes(q))) return true;
            return false;
        });
    });

    protected readonly totals = computed(() => {
        const list = this.filtered();
        const target = this.displayCurrency();
        const byStatus: Record<string, number> = {};
        let value = 0;
        for (const o of list) {
            byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
            value += this.referenceService.convert(
                o.totalAmount ?? 0,
                o.currency ?? 'EUR',
                target,
            );
        }
        return {
            count: list.length,
            value,
            byStatus,
            restaurants: new Set(list.map((o) => o.restaurantId)).size,
        };
    });

    ngOnInit(): void {
        this.referenceService.getCurrencies().subscribe();
        this.load(false);

        interval(15000)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.load(true));
    }

    restaurantName(id: number | null | undefined): string {
        if (id == null) return '-';
        return this.restaurants().find((r) => r.id === id)?.name ?? `#${id}`;
    }

    statusClass(s: string): string {
        return 'st-' + s.toLowerCase();
    }

    private load(silent: boolean): void {
        if (!silent) this.loading.set(true);
        forkJoin({
            orders: this.orderService.getLiveAll(),
            restaurants: this.restaurantService.getAll(),
        }).subscribe({
            next: ({ orders, restaurants }) => {
                if (!silent) this.loading.set(false);
                if (orders.isSuccess) this.orders.set(orders.value);
                if (restaurants.isSuccess) this.restaurants.set(restaurants.value);
            },
            error: () => {
                if (!silent) this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Could not load live orders',
                    life: 3000,
                });
            },
        });
    }
}
