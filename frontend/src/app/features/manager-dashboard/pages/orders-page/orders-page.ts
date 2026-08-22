import { CurrencyPipe, DatePipe } from '@angular/common';
import { NotifyService } from '../../../../shared/services/notify.service';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { OrderService, PagedOrderQuery } from '../../../../shared/services/order.service';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { ReferenceService } from '../../../../shared/services/reference.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { ROLES } from '../../../../core/constants/roles.constant';
import { OrderDTO, OrderStatus, PaymentMethod } from '../../../../shared/models/orderDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

const DISPLAY_CURRENCY_KEY = 'foodlyn_display_currency';

@Component({
    selector: 'app-manager-orders-page',
    imports: [
        CurrencyPipe,
        DatePipe,
        FormsModule,
        TableModule,
        SelectModule,
        InputTextModule,
        DialogModule,
    ],
    templateUrl: './orders-page.html',
    styleUrl: './orders-page.scss',
})
export class OrdersPage implements OnInit {
    private readonly orderService: OrderService = inject(OrderService);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly auth = inject(AuthService);
    protected readonly referenceService = inject(ReferenceService);
    protected readonly messageService: NotifyService = inject(NotifyService);

    protected readonly isAdmin = this.auth.currentUser()?.role === ROLES.SUPER_ADMIN;

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

    protected convertAmount(amount: number, fromCurrency: string | null): number {
        return this.referenceService.convert(
            amount ?? 0,
            fromCurrency ?? 'EUR',
            this.displayCurrency(),
        );
    }

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly restaurantOptions = computed(() => [
        { label: 'All restaurants', value: null as number | null },
        ...this.restaurants().map((r) => ({ label: r.name, value: r.id as number | null })),
    ]);
    protected readonly selectedRestaurantId = signal<number | null>(null);
    protected readonly restaurantsLoaded = signal(false);

    protected readonly orders = signal<OrderDTO[]>([]);
    protected readonly totalCount = signal(0);
    protected readonly loading = signal(false);

    protected readonly query = signal('');
    protected readonly filterStatus = signal<OrderStatus | null>(null);
    protected readonly filterPayment = signal<PaymentMethod | null>(null);
    protected readonly filterRange = signal<'today' | '7d' | '30d' | 'all'>('7d');

    protected readonly statusOptions: { label: string; value: OrderStatus | null }[] = [
        { label: 'All statuses', value: null },
        { label: 'Completed', value: 'Completed' },
        { label: 'Served', value: 'Served' },
        { label: 'Awaiting payment', value: 'AwaitingPayment' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Cancelled', value: 'Cancelled' },
    ];

    protected readonly paymentOptions: { label: string; value: PaymentMethod | null }[] = [
        { label: 'Any payment', value: null },
        { label: 'Cash', value: 'Cash' },
        { label: 'Card', value: 'Card' },
    ];

    protected readonly rangeOptions = [
        { label: 'Today', value: 'today' },
        { label: 'Last 7 days', value: '7d' },
        { label: 'Last 30 days', value: '30d' },
        { label: 'All time', value: 'all' },
    ] as const;

    private currentLazy: TableLazyLoadEvent | null = null;
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    protected readonly summary = computed(() => {
        const list = this.orders();
        const target = this.displayCurrency();
        const total = list.reduce(
            (s, o) => s + this.referenceService.convert(o.totalAmount ?? 0, o.currency ?? 'EUR', target),
            0,
        );
        return {
            count: this.totalCount(),
            total,
            avg: list.length === 0 ? 0 : total / list.length,
        };
    });

    protected readonly detailOpen = signal(false);
    protected readonly detail = signal<OrderDTO | null>(null);

    ngOnInit(): void {
        this.referenceService.getCurrencies().subscribe();
        const restaurants$ = this.isAdmin
            ? this.restaurantService.getAll()
            : this.restaurantService.getMine();
        restaurants$.subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.restaurants.set(res.value);
                }
                this.restaurantsLoaded.set(true);
                this.fetchPage();
            },
            error: () => {
                this.restaurantsLoaded.set(true);
                this.fetchPage();
            },
        });
    }

    protected onRestaurantChange(id: number | null): void {
        this.selectedRestaurantId.set(id);
        this.reload();
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        this.currentLazy = event;
        this.fetchPage();
    }

    private fetchPage(): void {
        if (!this.restaurantsLoaded()) return;
        const restaurantId = this.selectedRestaurantId();

        const event = this.currentLazy ?? { first: 0, rows: 10 };
        const first = event.first ?? 0;
        const rows = event.rows ?? 10;
        const sortField = (event.sortField as string | undefined) ?? null;
        const sortOrder = event.sortOrder ?? -1;

        const range = this.filterRange();
        let fromDate: string | null = null;
        if (range !== 'all') {
            const since = new Date();
            since.setHours(0, 0, 0, 0);
            if (range === '7d') since.setDate(since.getDate() - 6);
            else if (range === '30d') since.setDate(since.getDate() - 29);
            fromDate = since.toISOString();
        }

        const pq: PagedOrderQuery = {
            page: Math.floor(first / rows) + 1,
            pageSize: rows,
            search: this.query() || null,
            sortBy: sortField,
            sortDir: sortField ? (sortOrder >= 0 ? 'asc' : 'desc') : 'desc',
            status: this.filterStatus(),
            paymentMethod: this.filterPayment(),
            fromDate,
        };

        const request$ = restaurantId
            ? this.orderService.getPagedHistory(restaurantId, pq)
            : this.orderService.getPagedHistoryAll(pq);

        this.loading.set(true);
        request$
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.orders.set(res.value.items);
                        this.totalCount.set(res.value.totalCount);
                    }
                },
                error: () =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Could not load orders',
                        life: 3000,
                    }),
            });
    }

    onSearchChange(value: string): void {
        this.query.set(value);
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.reload(), 300);
    }

    setStatusFilter(value: OrderStatus | null): void {
        this.filterStatus.set(value);
        this.reload();
    }

    setPaymentFilter(value: PaymentMethod | null): void {
        this.filterPayment.set(value);
        this.reload();
    }

    setRange(value: 'today' | '7d' | '30d' | 'all'): void {
        this.filterRange.set(value);
        this.reload();
    }

    private reload(): void {
        if (this.currentLazy) this.currentLazy = { ...this.currentLazy, first: 0 };
        this.fetchPage();
    }

    protected openDetail(o: OrderDTO): void {
        this.detail.set(o);
        this.detailOpen.set(true);
    }

    protected closeDetail(): void {
        this.detailOpen.set(false);
        this.detail.set(null);
    }

    protected statusClass(s: OrderStatus): string {
        return 'st-' + s.toLowerCase();
    }
}
