import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { NotifyService } from '../../../../shared/services/notify.service';
import { Subscription, finalize, interval } from 'rxjs';
import { AuthService } from '../../../../shared/services/auth.service';
import { OrderService } from '../../../../shared/services/order.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { OrderDTO } from '../../../../shared/models/orderDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

const LOAD_KEY = 'statusDisplay';

@Component({
    selector: 'app-status-display-page',
    imports: [ImageUrlPipe],

    templateUrl: './status-display-page.html',
    styleUrl: './status-display-page.scss',
})
export class StatusDisplayPage implements OnInit, OnDestroy {
    private readonly auth = inject(AuthService);
    private readonly orderService = inject(OrderService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly restaurantService = inject(Restaurant);
    private readonly navigation = inject(NavigationService);
    private readonly messageService = inject(NotifyService);
    protected readonly loadingService = inject(LoadingService);

    protected readonly LOAD_KEY = LOAD_KEY;
    protected readonly orders = signal<OrderDTO[]>([]);
    protected readonly restaurant = signal<RestaurantDTO | null>(null);
    protected readonly now = signal(new Date());

    protected readonly preparing = computed(() =>
        this.orders()
            .filter((o) => o.status === 'Preparing')
            .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    );

    protected readonly ready = computed(() =>
        this.orders()
            .filter((o) => o.status === 'Ready')
            .sort((a, b) => Date.parse(b.readyAt ?? b.createdAt) - Date.parse(a.readyAt ?? a.createdAt)),
    );

    protected readonly clockLabel = computed(() => {
        const d = this.now();
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    });

    protected readonly dateLabel = computed(() => {
        const d = this.now();
        return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
    });

    private createdSub: Subscription | null = null;
    private updatedSub: Subscription | null = null;
    private removedSub: Subscription | null = null;
    private clockSub: Subscription | null = null;
    private reconnectedSub: Subscription | null = null;
    private restaurantId = 0;

    async ngOnInit(): Promise<void> {
        const rId = this.auth.currentUser()?.restaurantId;
        if (!rId) {
            this.messageService.add({
                severity: 'error',
                summary: 'No restaurant',
                detail: 'Your account has no restaurant assigned.',
                life: 4000,
            });
            return;
        }
        this.restaurantId = rId;

        this.loadRestaurant(rId);
        this.clockSub = interval(1000).subscribe(() => this.now.set(new Date()));
        this.reconnectedSub = this.realtime.reconnected$.subscribe(() => this.loadOrders());

        this.createdSub = this.realtime.created$.subscribe((o) => {
            this.orders.update((list) =>
                list.some((x) => x.id === o.id) ? list.map((x) => (x.id === o.id ? o : x)) : [o, ...list],
            );
        });
        this.updatedSub = this.realtime.updated$.subscribe((o) => {
            this.orders.update((list) =>
                list.some((x) => x.id === o.id)
                    ? list.map((x) => (x.id === o.id ? o : x))
                    : [o, ...list],
            );
        });
        this.removedSub = this.realtime.removed$.subscribe((id) => {
            this.orders.update((list) => list.filter((x) => x.id !== id));
        });

        try {
            await this.realtime.joinStaff('statusDisplay', rId);
        } catch {
        }

        this.loadOrders();
    }

    async ngOnDestroy(): Promise<void> {
        this.createdSub?.unsubscribe();
        this.updatedSub?.unsubscribe();
        this.removedSub?.unsubscribe();
        this.clockSub?.unsubscribe();
        this.reconnectedSub?.unsubscribe();
        if (this.restaurantId) {
            await this.realtime.leaveStaff('statusDisplay', this.restaurantId);
        }
    }

    private loadOrders(): void {
        if (!this.restaurantId) return;
        this.loadingService.start(LOAD_KEY);
        this.orderService
            .getStatusDisplay(this.restaurantId)
            .pipe(finalize(() => this.loadingService.stop(LOAD_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) this.orders.set(res.value);
                },
            });
    }

    private loadRestaurant(id: number): void {
        this.restaurantService.getPublic().subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    const r = res.value.find((x) => x.id === id);
                    if (r) this.restaurant.set(r);
                }
            },
        });
    }

    protected goToProfile(): void {
        this.navigation.goToProfile();
    }
}
