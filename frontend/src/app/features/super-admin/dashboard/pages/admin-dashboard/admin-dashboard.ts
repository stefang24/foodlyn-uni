import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Restaurant } from '../../../../../shared/services/restaurant.service';
import { User } from '../../../../../shared/services/user.service';
import { OrderService, TopRestaurantStatDTO } from '../../../../../shared/services/order.service';
import { RestaurantDTO } from '../../../../../shared/models/restaurantDTO.model';
import { UserDTO } from '../../../../../shared/models/userDTO.model';
import { OrderDTO } from '../../../../../shared/models/orderDTO.model';

interface RoleBreakdownItem {
    role: string;
    count: number;
    percent: number;
    color: string;
}

interface CuisineItem {
    name: string;
    count: number;
    percent: number;
}

interface TopRestaurantItem {
    restaurant: RestaurantDTO;
    staffCount: number;
}

interface TopRestaurantOrdersItem {
    restaurant: RestaurantDTO;
    orderCount: number;
    revenue: number;
    currency: string | null;
    percent: number;
}

@Component({
    selector: 'app-admin-dashboard',
    imports: [CurrencyPipe],
    templateUrl: './admin-dashboard.html',
    styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly userService: User = inject(User);
    private readonly orderService = inject(OrderService);

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly users = signal<UserDTO[]>([]);
    protected readonly liveOrders = signal<OrderDTO[]>([]);
    protected readonly topStats = signal<TopRestaurantStatDTO[]>([]);

    protected readonly totalRestaurants = computed(() => this.restaurants().length);
    protected readonly activeRestaurants = computed(
        () => this.restaurants().filter((r) => r.isActive).length,
    );
    protected readonly inactiveRestaurants = computed(
        () => this.restaurants().filter((r) => !r.isActive).length,
    );
    protected readonly totalUsers = computed(() => this.users().length);
    protected readonly activeUsers = computed(
        () => this.users().filter((u) => u.isActive).length,
    );
    protected readonly managers = computed(
        () => this.users().filter((u) => u.role === 'Manager').length,
    );
    protected readonly staff = computed(
        () =>
            this.users().filter(
                (u) => u.role === 'Cashier' || u.role === 'Cook' || u.role === 'Waiter',
            ).length,
    );
    protected readonly customers = computed(
        () => this.users().filter((u) => u.role === 'User').length,
    );

    protected readonly inFlightOrders = computed(() => this.liveOrders().length);
    protected readonly inFlightValue = computed(() =>
        this.liveOrders().reduce((sum, o) => sum + (o.totalAmount ?? 0), 0),
    );
    protected readonly restaurantsServing = computed(
        () => new Set(this.liveOrders().map((o) => o.restaurantId)).size,
    );

    protected readonly recentSignups = computed(() => {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return this.users().filter(
            (u) => u.role === 'User' && Date.parse(u.createdAt) >= cutoff,
        ).length;
    });

    protected readonly roleBreakdown = computed<RoleBreakdownItem[]>(() => {
        const u = this.users();
        const total = u.filter((x) => x.role !== 'Guest').length || 1;
        const palette: Record<string, string> = {
            SuperAdmin: '#7c3aed',
            Manager: '#6d28d9',
            Cashier: '#0891b2',
            Cook: '#dc2626',
            Waiter: '#ea580c',
            User: '#16a34a',
            StatusDisplay: '#475569',
        };
        const roles = ['SuperAdmin', 'Manager', 'Cashier', 'Cook', 'Waiter', 'StatusDisplay', 'User'];
        return roles
            .map((role) => {
                const count = u.filter((x) => x.role === role).length;
                return {
                    role,
                    count,
                    percent: Math.round((count / total) * 100),
                    color: palette[role] ?? '#475569',
                };
            })
            .filter((r) => r.count > 0);
    });

    protected readonly cuisineBreakdown = computed<CuisineItem[]>(() => {
        const counts = new Map<string, number>();
        for (const r of this.restaurants()) {
            const name = (r.cuisine ?? '').trim() || 'Unspecified';
            counts.set(name, (counts.get(name) ?? 0) + 1);
        }
        const total = this.restaurants().length || 1;
        return Array.from(counts.entries())
            .map(([name, count]) => ({
                name,
                count,
                percent: Math.round((count / total) * 100),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    });

    protected readonly topRestaurantsByTeam = computed<TopRestaurantItem[]>(() => {
        const u = this.users();
        return this.restaurants()
            .map((r) => ({
                restaurant: r,
                staffCount: u.filter(
                    (x) =>
                        (x.restaurantId === r.id ||
                            x.restaurantIds?.includes(r.id)) &&
                        x.role !== 'User' &&
                        x.role !== 'Guest',
                ).length,
            }))
            .filter((x) => x.staffCount > 0)
            .sort((a, b) => b.staffCount - a.staffCount)
            .slice(0, 5);
    });

    protected readonly topRestaurantsByOrders = computed<TopRestaurantOrdersItem[]>(() => {
        const byId = new Map(this.restaurants().map((r) => [r.id, r]));
        const items = this.topStats()
            .map((s) => {
                const restaurant = byId.get(s.restaurantId);
                if (!restaurant) return null;
                return {
                    restaurant,
                    orderCount: s.orderCount,
                    revenue: s.revenue,
                    currency: s.currency,
                };
            })
            .filter((x): x is Omit<TopRestaurantOrdersItem, 'percent'> => x !== null)
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 5);
        const max = items[0]?.orderCount ?? 1;
        return items.map((x) => ({ ...x, percent: Math.round((x.orderCount / max) * 100) }));
    });

    protected readonly topRestaurantsByRevenue = computed<TopRestaurantOrdersItem[]>(() => {
        const byId = new Map(this.restaurants().map((r) => [r.id, r]));
        const items = this.topStats()
            .map((s) => {
                const restaurant = byId.get(s.restaurantId);
                if (!restaurant) return null;
                return {
                    restaurant,
                    orderCount: s.orderCount,
                    revenue: s.revenue,
                    currency: s.currency,
                };
            })
            .filter((x): x is Omit<TopRestaurantOrdersItem, 'percent'> => x !== null)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        const max = items[0]?.revenue ?? 1;
        return items.map((x) => ({
            ...x,
            percent: max > 0 ? Math.round((x.revenue / max) * 100) : 0,
        }));
    });

    ngOnInit(): void {
        forkJoin({
            restaurants: this.restaurantService.getAll(),
            users: this.userService.getAll(),
            liveOrders: this.orderService.getLiveAll(),
            topStats: this.orderService.getTopRestaurants(),
        }).subscribe({
            next: ({ restaurants, users, liveOrders, topStats }) => {
                if (restaurants.isSuccess) this.restaurants.set(restaurants.value);
                if (users.isSuccess) this.users.set(users.value);
                if (liveOrders.isSuccess) this.liveOrders.set(liveOrders.value);
                if (topStats.isSuccess) this.topStats.set(topStats.value);
            },
        });
    }
}
