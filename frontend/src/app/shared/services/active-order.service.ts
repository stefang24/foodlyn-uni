import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { OrderService } from './order.service';
import { OrderRealtimeService } from './order-realtime.service';
import { Restaurant } from './restaurant.service';
import { OrderDTO } from '../models/orderDTO.model';
import { RestaurantDTO } from '../models/restaurantDTO.model';
import { ROLES } from '../../core/constants/roles.constant';

const ACTIVE_STATUSES = new Set([
    'Placed',
    'Approved',
    'Preparing',
    'Ready',
    'Served',
    'AwaitingPayment',
]);

@Injectable({ providedIn: 'root' })
export class ActiveOrderService {
    private readonly auth = inject(AuthService);
    private readonly orderService = inject(OrderService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly restaurantService = inject(Restaurant);

    private readonly _orders = signal<OrderDTO[]>([]);
    private readonly _restaurants = signal<RestaurantDTO[]>([]);
    private subs: Subscription[] = [];
    private started = false;

    readonly orders = computed(() =>
        this._orders()
            .filter((o) => ACTIVE_STATUSES.has(o.status))
            .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    );

    readonly primary = computed(() => this.orders()[0] ?? null);
    readonly hasActive = computed(() => this.orders().length > 0);

    constructor() {
        effect(() => {
            const user = this.auth.currentUser();
            const isCustomer =
                user?.role === ROLES.USER || user?.role === ROLES.GUEST;
            if (isCustomer && !this.started) {
                this.start();
            } else if (!isCustomer && this.started) {
                this.stop();
            }
        });
    }

    restaurantFor(order: OrderDTO): RestaurantDTO | null {
        if (order.restaurantId == null) return null;
        return this._restaurants().find((r) => r.id === order.restaurantId) ?? null;
    }

    refresh(): void {
        this.orderService.getMine().subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this._orders.set(res.value);
                    for (const o of this.orders()) this.joinOrder(o.id);
                }
            },
        });
    }

    private start(): void {
        this.started = true;
        this.refresh();
        this.loadRestaurants();

        this.subs.push(
            this.realtime.created$.subscribe((o) => {
                this._orders.update((list) =>
                    list.some((x) => x.id === o.id)
                        ? list.map((x) => (x.id === o.id ? o : x))
                        : [o, ...list],
                );
            }),
            this.realtime.updated$.subscribe((o) => {
                this._orders.update((list) =>
                    list.some((x) => x.id === o.id)
                        ? list.map((x) => (x.id === o.id ? o : x))
                        : [o, ...list],
                );
                if (o.id) this.joinOrder(o.id);
            }),
            this.realtime.removed$.subscribe((id) => {
                this._orders.update((list) => list.filter((x) => x.id !== id));
            }),
            this.realtime.reconnected$.subscribe(() => this.refresh()),
        );
    }

    private async joinOrder(orderId: number): Promise<void> {
        try {
            await this.realtime.joinOrder(orderId);
        } catch {
        }
    }

    private loadRestaurants(): void {
        this.restaurantService.getPublic().subscribe({
            next: (res) => {
                if (res.isSuccess) this._restaurants.set(res.value);
            },
        });
    }

    private stop(): void {
        this.started = false;
        for (const s of this.subs) s.unsubscribe();
        this.subs = [];
        this._orders.set([]);
    }
}
