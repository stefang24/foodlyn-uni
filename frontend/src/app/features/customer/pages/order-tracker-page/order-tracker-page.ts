import { CurrencyPipe, DatePipe } from '@angular/common';
import { NotifyService } from '../../../../shared/services/notify.service';
import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { OrderService } from '../../../../shared/services/order.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { SoundService } from '../../../../shared/services/sound.service';
import { CustomerSessionService } from '../../../../shared/services/customer-session.service';
import { TableSessionService } from '../../../../shared/services/table-session.service';
import { TableLobbyService } from '../../../../shared/services/table-lobby.service';
import { CheckoutDraftService } from '../../../../shared/services/checkout-draft.service';
import { TableService } from '../../../../shared/services/table.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { CartService } from '../../../../shared/services/cart.service';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { OrderDTO, OrderStatus } from '../../../../shared/models/orderDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

const LOAD_KEY = 'orderTracker';

interface TimelineStep {
    key: OrderStatus;
    label: string;
    icon: string;
    reached: boolean;
    active: boolean;
    at: string | null;
}

@Component({
    selector: 'app-order-tracker-page',
    imports: [
        DialogModule,
        InputTextModule,
        ConfirmDialogModule,
        FormsModule,
        CurrencyPipe,
        DatePipe,
    ],
    providers: [ConfirmationService],
    templateUrl: './order-tracker-page.html',
    styleUrl: './order-tracker-page.scss',
})
export class OrderTrackerPage implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly orderService = inject(OrderService);
    private readonly realtime = inject(OrderRealtimeService);
    protected readonly sound = inject(SoundService);
    private readonly customerSession = inject(CustomerSessionService);
    private readonly tableSession = inject(TableSessionService);
    private readonly lobbyService = inject(TableLobbyService);
    private readonly checkoutDraft = inject(CheckoutDraftService);
    private readonly tableService = inject(TableService);
    private readonly authService = inject(AuthService);
    private readonly cart = inject(CartService);
    private readonly restaurantService = inject(Restaurant);
    private readonly messageService = inject(NotifyService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);
    protected readonly loadingService = inject(LoadingService);

    private joinedTableId: number | null = null;

    protected readonly callWaiterDialog = signal(false);
    protected readonly callMessage = signal('');
    protected readonly callSending = signal(false);

    protected readonly endSessionDialog = signal(false);
    protected readonly endSessionMode = signal<'finished' | 'end'>('finished');
    protected readonly endingSession = signal(false);

    protected readonly LOAD_KEY = LOAD_KEY;
    protected readonly order = signal<OrderDTO | null>(null);
    protected readonly tableOrders = signal<OrderDTO[]>([]);
    protected readonly now = signal(Date.now());
    protected readonly session = this.customerSession.session;
    protected readonly restaurant = signal<RestaurantDTO | null>(null);
    protected readonly hasSession = computed(() => this.session() !== null);

    protected readonly progressPct = computed(() => {
        const o = this.order();
        if (!o || !o.preparingStartedAt || !o.prepTimeMinutes) return 0;
        if (o.status === 'Ready' || o.status === 'Served') return 100;
        const start = Date.parse(o.preparingStartedAt);
        const totalMs = o.prepTimeMinutes * 60 * 1000;
        const elapsed = this.now() - start;
        return Math.max(0, Math.min(100, (elapsed / totalMs) * 100));
    });

    protected readonly remainingLabel = computed(() => {
        const o = this.order();
        if (!o || !o.preparingStartedAt || !o.prepTimeMinutes) return '--:--';
        const start = Date.parse(o.preparingStartedAt);
        const totalMs = o.prepTimeMinutes * 60 * 1000;
        const remainingMs = Math.max(0, start + totalMs - this.now());
        if (remainingMs === 0) return 'Soon';
        const m = Math.floor(remainingMs / 60000);
        const s = Math.floor((remainingMs % 60000) / 1000);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    });

    protected readonly timeline = computed<TimelineStep[]>(() => {
        const o = this.order();
        if (!o) return [];
        const current = o.status;
        const rejected = current === 'Rejected' || current === 'Cancelled';

        const steps: TimelineStep[] = [
            { key: 'Placed', label: 'Placed', icon: 'pi pi-send', reached: true, active: current === 'Placed', at: o.createdAt },
            { key: 'Approved', label: 'Approved', icon: 'pi pi-check-circle', reached: !!o.approvedAt, active: current === 'Approved', at: o.approvedAt },
            { key: 'Preparing', label: 'Preparing', icon: 'pi pi-clock', reached: !!o.preparingStartedAt, active: current === 'Preparing', at: o.preparingStartedAt },
            { key: 'Ready', label: 'Ready', icon: 'pi pi-bell', reached: !!o.readyAt, active: current === 'Ready', at: o.readyAt },
            { key: 'Served', label: 'Served', icon: 'pi pi-flag-fill', reached: !!o.servedAt, active: current === 'Served', at: o.servedAt },
        ];

        if (rejected) {
            return [
                steps[0],
                { key: current, label: current, icon: 'pi pi-times-circle', reached: true, active: true, at: o.rejectedAt ?? o.cancelledAt },
            ];
        }

        return steps;
    });

    protected readonly isTerminal = computed(() => {
        const s = this.order()?.status;
        return s === 'Served' || s === 'Rejected' || s === 'Cancelled';
    });

    protected readonly canFinishEating = computed(() => {
        const s = this.order()?.status;
        const currentDone = s === 'Served' || s === 'AwaitingPayment' || s === 'Completed';
        if (!currentDone) return false;
        const others = this.tableOrders();
        return others.every(
            (o) => o.status === 'Served' || o.status === 'AwaitingPayment' || o.status === 'Completed',
        );
    });

    protected readonly isCancelable = computed(() => {
        const s = this.order()?.status;
        return s === 'Rejected' || s === 'Cancelled';
    });

    private tickerSub: Subscription | null = null;
    private createdSub: Subscription | null = null;
    private updatedSub: Subscription | null = null;
    private paramSub: Subscription | null = null;
    private orderId = 0;
    private lastStatus: OrderStatus | null = null;

    ngOnInit(): void {
        this.tickerSub = interval(200).subscribe(() => this.now.set(Date.now()));

        this.updatedSub = this.realtime.updated$.subscribe((o) => {
            this.tableOrders.update((list) =>
                list.some((x) => x.id === o.id) ? list.map((x) => (x.id === o.id ? o : x)) : list,
            );
            if (o.id !== this.orderId) return;
            const prev = this.lastStatus;
            this.order.set(o);
            this.lastStatus = o.status;
            if (prev != null && prev !== o.status) {
                this.sound.playCustomerStatusUpdate(o.status);
            }
        });

        this.realtime.reconnected$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.reloadCurrentOrder());

        this.paramSub = this.route.paramMap.subscribe((params) => {
            const id = Number(params.get('id'));
            if (!id) {
                this.resolveLatestOrder();
                return;
            }
            this.switchToOrder(id);
        });

        const s = this.session();
        const token = this.route.snapshot.paramMap.get('token') ?? '';
        if (s) {
            this.joinedTableId = s.tableId;
            void this.realtime.joinTable(s.tableId);
            this.realtime.tableLobbyChanged$
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((state) => {
                    if (state.tableId !== s.tableId) return;
                    if (state.stage === 'Tracking') {
                        this.refreshTableOrders();
                    }
                    if (state.stage === 'Menu') {
                        const status = this.order()?.status;
                        if (status === 'Cancelled' || status === 'Rejected') {
                            this.tableSession.clear();
                            this.checkoutDraft.clear();
                            this.router.navigate(['/t', token, 'menu']);
                        }
                    } else if (state.stage === 'Choice') {
                        this.tableSession.clear();
                        this.checkoutDraft.clear();
                        this.authService.logout().subscribe({
                            next: () => this.afterLogoutToLanding(token),
                            error: () => this.afterLogoutToLanding(token),
                        });
                    }
                });
        }
    }

    private afterLogoutToLanding(token: string): void {
        this.customerSession.clear();
        this.cart.clear();
        this.router.navigate(['/t', token]);
    }

    private reloadCurrentOrder(): void {
        if (!this.orderId) return;
        const id = this.orderId;
        this.orderService.getById(id).subscribe({
            next: (res) => {
                if (this.orderId !== id || !res.isSuccess) return;
                const prev = this.lastStatus;
                this.order.set(res.value);
                this.lastStatus = res.value.status;
                if (prev != null && prev !== res.value.status) {
                    this.sound.playCustomerStatusUpdate(res.value.status);
                }
            },
        });
    }

    private handleAccessDenied(): void {
        const token = this.route.snapshot.paramMap.get('token');
        this.messageService.add({
            severity: 'error',
            summary: 'Not allowed',
            detail: "You can't view this order.",
            life: 3000,
        });
        if (token) {
            this.router.navigate(['/t', token]);
        } else {
            this.router.navigate(['/']);
        }
    }

    private async switchToOrder(id: number): Promise<void> {
        if (this.orderId === id) return;

        const previousId = this.orderId;
        this.orderId = id;
        this.order.set(null);
        this.restaurant.set(null);
        this.lastStatus = null;

        if (previousId) {
            try {
                await this.realtime.leaveOrder(previousId);
            } catch {
            }
        }

        this.loadingService.start(LOAD_KEY);
        this.orderService
            .getById(id)
            .pipe(finalize(() => this.loadingService.stop(LOAD_KEY)))
            .subscribe({
                next: (res) => {
                    if (this.orderId !== id) return;
                    if (res.isSuccess) {
                        this.order.set(res.value);
                        this.lastStatus = res.value.status;
                        this.refreshTableOrders();
                        if (!this.session() && res.value.restaurantId != null) {
                            this.loadRestaurant(res.value.restaurantId);
                        }
                    } else {
                        this.handleAccessDenied();
                    }
                },
                error: (err) => {
                    if (err?.status === 403 || err?.status === 404) {
                        this.handleAccessDenied();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Could not load order',
                            life: 3000,
                        });
                    }
                },
            });

        try {
            await this.realtime.joinOrder(id);
        } catch {
        }
    }

    private static readonly ACTIVE_STATUSES: OrderStatus[] = [
        'Placed', 'Approved', 'Preparing', 'Ready', 'Served', 'AwaitingPayment',
    ];

    private activeAtMyTable(orders: OrderDTO[]): OrderDTO[] {
        const tableId = this.order()?.tableId ?? this.session()?.tableId ?? null;
        return orders
            .filter(
                (o) =>
                    OrderTrackerPage.ACTIVE_STATUSES.includes(o.status) &&
                    (tableId == null || o.tableId === tableId),
            )
            .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    }

    private refreshTableOrders(): void {
        this.orderService.getMine().subscribe({
            next: (res) => {
                if (res.isSuccess) this.tableOrders.set(this.activeAtMyTable(res.value));
            },
        });
    }

    private resolveLatestOrder(): void {
        const token = this.route.snapshot.paramMap.get('token');
        this.orderService.getMine().subscribe({
            next: (res) => {
                const active = res.isSuccess ? this.activeAtMyTable(res.value) : [];
                if (active.length > 0 && token) {
                    const latest = active[active.length - 1];
                    this.router.navigate(['/t', token, 'order', latest.id], { replaceUrl: true });
                } else {
                    this.back();
                }
            },
            error: () => this.back(),
        });
    }

    protected switchTab(id: number): void {
        const token = this.route.snapshot.paramMap.get('token');
        if (!token || id === this.order()?.id) return;
        this.router.navigate(['/t', token, 'order', id]);
    }

    async ngOnDestroy(): Promise<void> {
        this.tickerSub?.unsubscribe();
        this.createdSub?.unsubscribe();
        this.updatedSub?.unsubscribe();
        this.paramSub?.unsubscribe();
        if (this.orderId) {
            await this.realtime.leaveOrder(this.orderId);
        }
        if (this.joinedTableId !== null) {
            await this.realtime.leaveTable(this.joinedTableId);
            this.joinedTableId = null;
        }
    }

    protected cancel(): void {
        const o = this.order();
        if (!o || o.status !== 'Placed') return;
        this.confirmationService.confirm({
            header: 'Cancel order?',
            message:
                'This will cancel the order. You will be returned to the menu where you can place a new one.',
            acceptLabel: 'Cancel order',
            rejectLabel: 'Keep',
            acceptButtonStyleClass: 'p-button-danger p-button-sm',
            rejectButtonStyleClass: 'p-button-text p-button-sm',
            accept: () => this.confirmCancel(o.id),
        });
    }

    private confirmCancel(orderId: number): void {
        this.orderService.cancel(orderId).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.order.set(res.value);
                    this.restartFreshSession();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not cancel',
                        life: 3000,
                    });
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Could not cancel',
                    life: 3000,
                }),
        });
    }

    private restartFreshSession(): void {
        const token = this.route.snapshot.paramMap.get('token');
        const s = this.session();
        if (!token || !s) {
            this.back();
            return;
        }

        this.tableSession.clear();
        this.checkoutDraft.clear();

        this.tableSession
            .startGuest({
                qrToken: token,
                customerLatitude: null,
                customerLongitude: null,
                asGuest: true,
                partySize: this.customerSession.partySize() ?? 1,
            })
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.tableSession.setSession(res.value);
                        this.router.navigate(['/t', token, 'menu']);
                    } else {
                        this.router.navigate(['/t', token]);
                    }
                },
                error: () => this.router.navigate(['/t', token]),
            });
    }

    protected back(): void {
        const token = this.route.snapshot.paramMap.get('token');
        if (token) {
            const tableId = this.session()?.tableId ?? this.order()?.tableId ?? null;
            if (tableId) {
                this.lobbyService.advance(tableId, { stage: 'Menu' }).subscribe();
            }
            this.tableSession.access(token).subscribe({
                next: (res) => {
                    const a = res.isSuccess ? res.value : null;
                    if (a?.hasOpenSession && a.isSessionMember) {
                        this.router.navigate(['/t', token, 'menu']);
                    } else if (a?.canStartFresh) {
                        this.router.navigate(['/t', token, 'party']);
                    } else {
                        this.router.navigate(['/t', token]);
                    }
                },
                error: () => this.router.navigate(['/t', token]),
            });
            return;
        }
        const id = this.order()?.id ?? this.orderId;
        if (id) {
            this.orderService.getReturnLink(id).subscribe({
                next: (res) => {
                    if (res.isSuccess && res.value?.qrToken) {
                        this.router.navigate(['/t', res.value.qrToken, 'menu']);
                    } else {
                        this.fallbackBack();
                    }
                },
                error: () => this.fallbackBack(),
            });
            return;
        }
        this.fallbackBack();
    }

    private fallbackBack(): void {
        const slug = this.restaurant()?.slug ?? this.session()?.restaurantSlug ?? null;
        this.router.navigate(slug ? ['/r', slug] : ['/restaurants']);
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

    protected openCallWaiter(): void {
        this.callMessage.set('');
        this.callWaiterDialog.set(true);
    }

    protected submitCallWaiter(): void {
        const s = this.session();
        if (!s) return;
        const msg = this.callMessage().trim();
        this.callSending.set(true);
        this.tableService
            .callWaiter(s.tableId, msg.length > 0 ? msg : null)
            .pipe(finalize(() => this.callSending.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.callWaiterDialog.set(false);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Waiter called',
                            detail: 'A waiter will be with you shortly.',
                            life: 2500,
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not call waiter',
                            life: 3000,
                        });
                    }
                },
                error: () =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Could not call waiter',
                        life: 3000,
                    }),
            });
    }

    protected endSession(): void {
        this.endSessionMode.set('end');
        this.endSessionDialog.set(true);
    }

    protected finishedEating(): void {
        this.endSessionMode.set('finished');
        this.endSessionDialog.set(true);
    }

    protected confirmEndSession(): void {
        this.endingSession.set(true);
        const s = this.session();
        if (!s) {
            this.cleanupStandalone();
            return;
        }
        this.tableService.closeSession(s.tableId).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.navigateAfterEnd();
                } else {
                    this.closeSessionFailed(res.error);
                }
            },
            error: (err) => this.closeSessionFailed(err?.error?.error),
        });
    }

    private closeSessionFailed(code: string | null | undefined): void {
        this.endingSession.set(false);
        this.endSessionDialog.set(false);
        this.messageService.add({
            severity: 'warn',
            summary: 'Not yet',
            detail:
                code === 'ORDERS_STILL_ACTIVE'
                    ? 'Some orders at this table are still being prepared. You can finish once everything is served.'
                    : (code ?? 'Could not close the session'),
            life: 4000,
        });
        this.refreshTableOrders();
    }

    private navigateAfterEnd(): void {
        this.authService.logout().subscribe({
            next: () => this.cleanup(),
            error: () => this.cleanup(),
        });
    }

    private cleanup(): void {
        const slug = this.session()?.restaurantSlug ?? null;
        const target = slug ? ['/r', slug] : ['/'];
        this.customerSession.clear();
        this.cart.clear();
        this.endSessionDialog.set(false);
        this.endingSession.set(false);
        this.router.navigate(target);
    }

    private cleanupStandalone(): void {
        const slug = this.restaurant()?.slug ?? null;
        const target = slug ? ['/r', slug] : ['/restaurants'];
        this.endSessionDialog.set(false);
        this.endingSession.set(false);
        this.router.navigate(target);
    }
}
