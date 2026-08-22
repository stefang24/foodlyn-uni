import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { ReferenceService } from '../../../../shared/services/reference.service';
import {
    AnalyticsRange,
    OrderAnalyticsDTO,
    OrderService,
} from '../../../../shared/services/order.service';
import { TableService, TableStatusDTO } from '../../../../shared/services/table.service';
import { OrderDTO } from '../../../../shared/models/orderDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

@Component({
    selector: 'app-dashboard-page',
    imports: [DecimalPipe, FormsModule, SelectModule, RouterLink],
    templateUrl: './dashboard-page.html',
    styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly orderService: OrderService = inject(OrderService);
    private readonly tableService: TableService = inject(TableService);
    protected readonly referenceService = inject(ReferenceService);

    private readonly DISPLAY_CURRENCY_KEY = 'foodlyn_display_currency';
    protected readonly displayCurrency = signal<string>(
        localStorage.getItem(this.DISPLAY_CURRENCY_KEY) ?? 'EUR',
    );

    protected readonly currencyOptions = computed(() =>
        this.referenceService.currencies().map((c) => ({
            label: `${c.code}${c.symbol ? ' (' + c.symbol + ')' : ''}`,
            value: c.code,
        })),
    );

    protected readonly displaySymbol = computed(() =>
        this.referenceService.getSymbol(this.displayCurrency()) || this.displayCurrency(),
    );

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly selectedRestaurantId = signal<number | null>(null);
    protected readonly restaurantOptions = computed(() => [
        { label: 'All restaurants', value: null as number | null },
        ...this.restaurants().map((r) => ({ label: r.name, value: r.id as number | null })),
    ]);

    protected readonly range = signal<AnalyticsRange>('Week');
    protected readonly selectedYear = signal<number>(new Date().getFullYear());
    protected readonly selectedMonth = signal<number>(new Date().getMonth() + 1);

    protected readonly rangeOptions = [
        { label: 'Week', value: 'Week' as AnalyticsRange },
        { label: 'Month', value: 'Month' as AnalyticsRange },
        { label: 'Year', value: 'Year' as AnalyticsRange },
        { label: 'Lifetime', value: 'Lifetime' as AnalyticsRange },
    ];

    protected readonly monthOptions = [
        { label: 'January', value: 1 },
        { label: 'February', value: 2 },
        { label: 'March', value: 3 },
        { label: 'April', value: 4 },
        { label: 'May', value: 5 },
        { label: 'June', value: 6 },
        { label: 'July', value: 7 },
        { label: 'August', value: 8 },
        { label: 'September', value: 9 },
        { label: 'October', value: 10 },
        { label: 'November', value: 11 },
        { label: 'December', value: 12 },
    ];

    protected readonly yearOptions = computed(() => {
        const current = new Date().getFullYear();
        const opts: { label: string; value: number }[] = [];
        for (let y = current; y >= current - 5; y--) {
            opts.push({ label: String(y), value: y });
        }
        return opts;
    });

    protected readonly activeOrders = signal<OrderDTO[]>([]);
    protected readonly awaitingPayment = signal<OrderDTO[]>([]);
    protected readonly tables = signal<TableStatusDTO[]>([]);
    protected readonly analytics = signal<OrderAnalyticsDTO | null>(null);

    protected readonly activeOrdersCount = computed(() => this.activeOrders().length);
    protected readonly awaitingPaymentCount = computed(() => this.awaitingPayment().length);

    protected readonly periodTotalOrders = computed(() => this.analytics()?.totalCompleted ?? 0);
    protected readonly periodRevenue = computed(() =>
        this.referenceService.convert(
            this.analytics()?.totalRevenue ?? 0,
            'EUR',
            this.displayCurrency(),
        ),
    );
    protected readonly periodAvgOrder = computed(() =>
        this.referenceService.convert(
            this.analytics()?.avgOrderValue ?? 0,
            'EUR',
            this.displayCurrency(),
        ),
    );
    protected readonly chartBars = computed(() => {
        const bars = this.analytics()?.bars ?? [];
        const display = this.displayCurrency();
        return bars.map((b) => ({
            ...b,
            revenue: this.referenceService.convert(b.revenue, 'EUR', display),
        }));
    });
    protected readonly mostSold = computed(() => this.analytics()?.mostSold ?? []);

    protected setDisplayCurrency(code: string): void {
        this.displayCurrency.set(code);
        localStorage.setItem(this.DISPLAY_CURRENCY_KEY, code);
    }

    protected readonly yAxisMax = computed(() => {
        const bars = this.chartBars();
        if (bars.length === 0) return 0;
        const max = Math.max(...bars.map((b) => b.revenue));
        return this.niceMax(max);
    });

    protected readonly yTicks = computed(() => {
        const max = this.yAxisMax();
        const ticks: { label: string }[] = [];
        for (let i = 4; i >= 0; i--) {
            const v = (max * i) / 4;
            ticks.push({ label: this.formatY(v) });
        }
        return ticks;
    });

    protected barHeightPercent(revenue: number): number {
        const max = this.yAxisMax();
        if (max <= 0) return 0;
        return Math.min(100, (revenue / max) * 100);
    }

    private niceMax(value: number): number {
        if (value <= 0) return 0;
        const mag = Math.pow(10, Math.floor(Math.log10(value)));
        const n = value / mag;
        let nice: number;
        if (n <= 1) nice = 1;
        else if (n <= 2) nice = 2;
        else if (n <= 5) nice = 5;
        else nice = 10;
        return nice * mag;
    }

    private formatY(v: number): string {
        const sym = this.referenceService.getSymbol(this.displayCurrency()) || this.displayCurrency();
        if (v >= 1000) {
            const k = v / 1000;
            return sym + (k >= 10 ? Math.round(k) : k.toFixed(1)) + 'k';
        }
        return sym + Math.round(v);
    }

    protected readonly chartTitle = computed(() => {
        switch (this.range()) {
            case 'Week':
                return 'Revenue · last 7 days';
            case 'Month': {
                const m = this.monthOptions.find((o) => o.value === this.selectedMonth())?.label ?? '';
                return `Revenue · ${m} ${this.selectedYear()}`;
            }
            case 'Year':
                return `Revenue · ${this.selectedYear()}`;
            case 'Lifetime':
                return 'Revenue · lifetime (per year)';
        }
    });

    protected readonly headerTitle = computed(() => {
        switch (this.range()) {
            case 'Week':
                return "This week's performance";
            case 'Month': {
                const m = this.monthOptions.find((o) => o.value === this.selectedMonth())?.label ?? '';
                return `${m} ${this.selectedYear()} performance`;
            }
            case 'Year':
                return `${this.selectedYear()} performance`;
            case 'Lifetime':
                return 'Lifetime performance';
        }
    });

    protected readonly periodLabel = computed(() => {
        switch (this.range()) {
            case 'Week':
                return 'Last 7 days';
            case 'Month':
                return 'Selected month';
            case 'Year':
                return 'Selected year';
            case 'Lifetime':
                return 'All time';
        }
    });

    protected readonly totalTables = computed(() => this.tables().length);
    protected readonly occupiedTables = computed(
        () =>
            this.tables().filter(
                (t) => t.activeOrders > 0 || t.status === 'Eating' || t.status === 'Occupied',
            ).length,
    );
    protected readonly cleaningTables = computed(
        () => this.tables().filter((t) => t.status === 'Cleaning').length,
    );

    ngOnInit(): void {
        this.referenceService.getCurrencies().subscribe();
        this.restaurantService.getMine().subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.restaurants.set(res.value);
                }
                this.loadAll();
            },
            error: () => this.loadAll(),
        });
    }

    protected onRestaurantChange(id: number | null): void {
        this.selectedRestaurantId.set(id);
        this.loadAll();
    }

    protected onRangeChange(value: AnalyticsRange): void {
        this.range.set(value);
        this.loadAnalytics();
    }

    protected onYearChange(year: number): void {
        this.selectedYear.set(year);
        this.loadAnalytics();
    }

    protected onMonthChange(month: number): void {
        this.selectedMonth.set(month);
        this.loadAnalytics();
    }

    private loadAll(): void {
        this.loadLiveState();
        this.loadAnalytics();
    }

    private loadLiveState(): void {
        const id = this.selectedRestaurantId();
        const ids = id ? [id] : this.restaurants().map((r) => r.id);

        if (ids.length === 0) {
            this.activeOrders.set([]);
            this.awaitingPayment.set([]);
            this.tables.set([]);
            return;
        }

        forkJoin(
            ids.map((rid) =>
                forkJoin({
                    active: this.orderService.getCashierQueue(rid),
                    awaiting: this.orderService.getAwaitingPayment(rid),
                    tables: this.tableService.getStatus(rid),
                }),
            ),
        ).subscribe({
            next: (results) => {
                const active: OrderDTO[] = [];
                const awaiting: OrderDTO[] = [];
                const tables: TableStatusDTO[] = [];

                for (const r of results) {
                    if (r.active.isSuccess) active.push(...r.active.value);
                    if (r.awaiting.isSuccess) awaiting.push(...r.awaiting.value);
                    if (r.tables.isSuccess) tables.push(...r.tables.value);
                }

                this.activeOrders.set(active);
                this.awaitingPayment.set(awaiting);
                this.tables.set(tables);
            },
        });
    }

    private loadAnalytics(): void {
        const range = this.range();
        const restaurantId = this.selectedRestaurantId();

        this.orderService
            .getAnalytics({
                restaurantId,
                range,
                year: range === 'Month' || range === 'Year' ? this.selectedYear() : null,
                month: range === 'Month' ? this.selectedMonth() : null,
            })
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) this.analytics.set(res.value);
                },
            });
    }
}
