import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NotifyService } from '../../../../shared/services/notify.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuItemCard } from '../../../../shared/components/menu-item-card/menu-item-card';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { CustomerService } from '../../../../shared/services/customer.service';
import { CustomerSessionService } from '../../../../shared/services/customer-session.service';
import { TableSessionService } from '../../../../shared/services/table-session.service';
import { TableLobbyService } from '../../../../shared/services/table-lobby.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { TableService } from '../../../../shared/services/table.service';
import { MenuDTO, MenuItemDTO } from '../../../../shared/models/menuDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

const LOAD_KEY = 'customerMenu';

@Component({
    selector: 'app-customer-menu-page',
    imports: [
        DialogModule,
        ConfirmDialogModule,
        ButtonModule,
        InputTextModule,
        FormsModule,
        CurrencyPipe,
        MenuItemCard,
        ImageUrlPipe,
    ],
    providers: [ConfirmationService],
    templateUrl: './customer-menu-page.html',
    styleUrl: './customer-menu-page.scss',
})
export class CustomerMenuPage implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly customerService = inject(CustomerService);
    private readonly customerSession = inject(CustomerSessionService);
    protected readonly tableSession = inject(TableSessionService);
    private readonly lobbyService = inject(TableLobbyService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly authService = inject(AuthService);
    private readonly tableService = inject(TableService);
    private readonly messageService = inject(NotifyService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);
    protected readonly loadingService = inject(LoadingService);

    private cartSub: Subscription | null = null;
    private closedSub: Subscription | null = null;
    private joinedSessionId: number | null = null;
    private joinedTableId: number | null = null;

    protected readonly callWaiterDialog = signal(false);
    protected readonly callMessage = signal('');
    protected readonly callSending = signal(false);

    protected readonly LOAD_KEY = LOAD_KEY;

    protected readonly menus = signal<MenuDTO[]>([]);
    protected readonly selectedMenuId = signal<number | null>(null);
    protected readonly restaurant = signal<RestaurantDTO | null>(null);
    protected readonly restaurantCurrency = computed(() => this.restaurant()?.currency ?? null);

    protected readonly session = this.customerSession.session;
    protected readonly selectedMenu = computed(
        () => this.menus().find((m) => m.id === this.selectedMenuId()) ?? null,
    );

    protected readonly dialogOpen = signal(false);
    protected readonly dialogItem = signal<MenuItemDTO | null>(null);
    protected readonly dialogQuantity = signal(1);
    protected readonly dialogNotes = signal('');
    protected readonly dialogSelectedModIds = signal<ReadonlySet<number>>(new Set());

    protected readonly dialogUnitPrice = computed(() => {
        const i = this.dialogItem();
        if (!i) return 0;
        return i.discountedPrice ?? i.price;
    });

    protected readonly dialogModifiersTotal = computed(() => {
        const i = this.dialogItem();
        if (!i) return 0;
        const selected = this.dialogSelectedModIds();
        let total = 0;
        for (const g of i.modifierGroups ?? []) {
            for (const m of g.modifiers) {
                if (selected.has(m.id)) total += m.priceDelta;
            }
        }
        return total;
    });

    protected readonly dialogTotal = computed(
        () => (this.dialogUnitPrice() + this.dialogModifiersTotal()) * this.dialogQuantity(),
    );

    protected readonly dialogCanConfirm = computed(() => {
        const i = this.dialogItem();
        if (!i) return false;
        const selected = this.dialogSelectedModIds();
        for (const g of i.modifierGroups ?? []) {
            if (!g.isActive) continue;
            const count = g.modifiers.filter((m) => selected.has(m.id)).length;
            if (count < g.minSelect || count > g.maxSelect) return false;
        }
        return true;
    });

    async ngOnInit(): Promise<void> {
        const session = this.session();
        if (!session) {
            const token = this.route.snapshot.paramMap.get('token');
            this.router.navigate(['/t', token ?? '']);
            return;
        }
        this.loadMenus(session.restaurantId);
        this.loadRestaurant(session.restaurantId);

        const active = this.tableSession.session();
        if (active) {
            this.joinedSessionId = active.id;
            await this.realtime.joinSession(active.id);
            this.tableSession.getById(active.id).subscribe({
                next: (res) => {
                    if (res.isSuccess) this.tableSession.setSession(res.value);
                },
            });
        } else {
            this.tableSession.getForTable(session.tableId).subscribe({
                next: async (res) => {
                    if (res.isSuccess) {
                        this.tableSession.setSession(res.value);
                        this.joinedSessionId = res.value.id;
                        await this.realtime.joinSession(res.value.id);
                    } else {
                        this.autoStartFreshSession();
                    }
                },
                error: () => this.autoStartFreshSession(),
            });
        }

        this.cartSub = this.realtime.sessionCartUpdated$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((s) => {
                const local = this.tableSession.session();
                if (!local || local.id !== s.id) return;
                this.tableSession.setSession(s);
            });

        this.closedSub = this.realtime.sessionClosed$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((id) => {
                const local = this.tableSession.session();
                if (local && local.id === id) {
                    this.tableSession.clear();
                }
            });

        this.realtime.reconnected$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                const tk = this.route.snapshot.paramMap.get('token') ?? '';
                this.lobbyService.get(session.tableId).subscribe({
                    next: (res) => {
                        const lobby = res.isSuccess ? res.value : null;
                        if (lobby && lobby.stage === 'Tracking' && lobby.orderId) {
                            this.tableSession.clear();
                            this.router.navigate(['/t', tk, 'order', lobby.orderId]);
                        }
                    },
                });
                const local = this.tableSession.session();
                if (!local) return;
                this.tableSession.getById(local.id).subscribe({
                    next: (res) => {
                        if (res.isSuccess && res.value.status === 'Open') {
                            this.tableSession.setSession(res.value);
                        }
                    },
                });
            });

        const token = this.route.snapshot.paramMap.get('token') ?? '';
        this.joinedTableId = session.tableId;
        await this.realtime.joinTable(session.tableId);
        await this.realtime.joinTableOrders(session.tableId);

        this.realtime.created$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((order) => {
                if (order.tableId !== session.tableId) return;
                this.tableSession.clear();
                this.router.navigate(['/t', token, 'order', order.id]);
            });

        this.realtime.tableLobbyChanged$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                if (state.tableId !== session.tableId) return;
                if (state.stage === 'Tracking' && state.orderId) {
                    this.tableSession.clear();
                    this.router.navigate(['/t', token, 'order', state.orderId]);
                } else if (state.stage === 'Choice') {
                    this.leave();
                }
            });
    }

    async ngOnDestroy(): Promise<void> {
        this.cartSub?.unsubscribe();
        this.closedSub?.unsubscribe();
        if (this.joinedSessionId !== null) {
            await this.realtime.leaveSession(this.joinedSessionId);
            this.joinedSessionId = null;
        }
        if (this.joinedTableId !== null) {
            await this.realtime.leaveTable(this.joinedTableId);
            await this.realtime.leaveTableOrders(this.joinedTableId);
            this.joinedTableId = null;
        }
    }

    private loadRestaurant(restaurantId: number): void {
        this.customerService.getRestaurant(restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) this.restaurant.set(res.value);
            },
        });
    }

    private loadMenus(restaurantId: number): void {
        this.loadingService.start(LOAD_KEY);
        this.customerService
            .getMenus(restaurantId)
            .pipe(finalize(() => this.loadingService.stop(LOAD_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.menus.set(res.value);
                        if (res.value.length > 0) {
                            this.selectedMenuId.set(res.value[0].id);
                        }
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not load menu',
                            life: 3000,
                        });
                    }
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Could not load menu',
                        life: 3000,
                    });
                },
            });
    }

    protected selectMenu(id: number): void {
        this.selectedMenuId.set(id);
    }

    protected openAddToCart(item: MenuItemDTO): void {
        this.dialogItem.set(item);
        this.dialogQuantity.set(1);
        this.dialogNotes.set('');
        this.dialogSelectedModIds.set(new Set());
        this.dialogOpen.set(true);
    }

    protected toggleModifier(groupId: number, modifierId: number, maxSelect: number): void {
        const item = this.dialogItem();
        if (!item) return;
        const group = item.modifierGroups.find((g) => g.id === groupId);
        if (!group) return;

        const next = new Set(this.dialogSelectedModIds());
        if (next.has(modifierId)) {
            next.delete(modifierId);
        } else {
            if (maxSelect === 1) {
                for (const m of group.modifiers) next.delete(m.id);
            } else {
                const count = group.modifiers.filter((m) => next.has(m.id)).length;
                if (count >= maxSelect) return;
            }
            next.add(modifierId);
        }
        this.dialogSelectedModIds.set(next);
    }

    protected isModSelected(modifierId: number): boolean {
        return this.dialogSelectedModIds().has(modifierId);
    }

    protected closeDialog(): void {
        this.dialogOpen.set(false);
    }

    protected inc(): void {
        this.dialogQuantity.update((q) => Math.min(99, q + 1));
    }

    protected dec(): void {
        this.dialogQuantity.update((q) => Math.max(1, q - 1));
    }

    protected confirmAdd(): void {
        const item = this.dialogItem();
        if (!item) return;
        const qty = this.dialogQuantity();
        if (qty <= 0) return;
        if (!this.dialogCanConfirm()) return;

        const session = this.tableSession.session();
        if (!session) {
            this.messageService.add({
                severity: 'error',
                summary: 'Session lost',
                detail: 'Please scan the QR again.',
                life: 3000,
            });
            return;
        }

        const notes = this.dialogNotes().trim();
        const selected = this.dialogSelectedModIds();
        const modifierIds: number[] = [];
        for (const g of item.modifierGroups ?? []) {
            for (const m of g.modifiers) {
                if (selected.has(m.id)) modifierIds.push(m.id);
            }
        }

        this.tableSession
            .addLine(session.id, {
                menuItemId: item.id,
                quantity: qty,
                notes: notes.length > 0 ? notes : null,
                modifierIds,
            })
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.tableSession.setSession(res.value);
                        this.dialogOpen.set(false);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Added',
                            detail: `${qty} × ${item.name}`,
                            life: 1800,
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not add to cart',
                            life: 3000,
                        });
                    }
                },
                error: () =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Could not add to cart',
                        life: 3000,
                    }),
            });
    }

    protected goToCart(): void {
        const token = this.route.snapshot.paramMap.get('token');
        this.router.navigate(['/t', token ?? '', 'cart']);
    }

    protected leave(): void {
        const token = this.route.snapshot.paramMap.get('token');
        const target = token ? ['/t', token] : ['/'];
        this.customerSession.clear();
        this.tableSession.clear();
        this.authService.logout().subscribe({
            next: () => this.router.navigate(target),
            error: () => this.router.navigate(target),
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
        this.confirmationService.confirm({
            header: 'Stop ordering?',
            message:
                'This will close the shared session for everyone at this table and clear the cart. Scanning the QR again will start a fresh order.',
            acceptLabel: 'Stop ordering',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger p-button-sm',
            rejectButtonStyleClass: 'p-button-text p-button-sm',
            accept: () => this.confirmStopOrdering(),
        });
    }

    private confirmStopOrdering(): void {
        const sessionId = this.tableSession.session()?.id;
        if (!sessionId) {
            this.leave();
            return;
        }
        this.tableSession.closeSession(sessionId).subscribe({
            next: () => this.leave(),
            error: () => this.leave(),
        });
    }

    private async autoStartFreshSession(): Promise<void> {
        const token = this.route.snapshot.paramMap.get('token');
        if (!token) return;

        let coords: GeolocationCoordinates | null = null;
        try {
            coords = await this.captureGeo();
        } catch {
            coords = null;
        }

        this.tableSession
            .startGuest({
                qrToken: token,
                customerLatitude: coords?.latitude ?? null,
                customerLongitude: coords?.longitude ?? null,
                asGuest: true,
                partySize: this.customerSession.partySize() ?? 1,
            })
            .subscribe({
                next: async (res) => {
                    if (res.isSuccess) {
                        this.tableSession.setSession(res.value);
                        this.joinedSessionId = res.value.id;
                        await this.realtime.joinSession(res.value.id);
                    }
                },
            });
    }

    private captureGeo(): Promise<GeolocationCoordinates | null> {
        return new Promise((resolve) => {
            if (!('geolocation' in navigator)) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pos.coords),
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 },
            );
        });
    }
}
