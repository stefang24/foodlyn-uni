import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomerSessionService } from '../../../../shared/services/customer-session.service';
import { CheckoutDraftService } from '../../../../shared/services/checkout-draft.service';
import { TableSessionService } from '../../../../shared/services/table-session.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { CustomerService } from '../../../../shared/services/customer.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

@Component({
    selector: 'app-cart-page',
    imports: [CurrencyPipe, FormsModule, ImageUrlPipe],
    templateUrl: './cart-page.html',
    styleUrl: './cart-page.scss',
})
export class CartPage implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly customerSession = inject(CustomerSessionService);
    private readonly checkoutDraft = inject(CheckoutDraftService);
    protected readonly tableSession = inject(TableSessionService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly authService = inject(AuthService);
    private readonly customerService = inject(CustomerService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly session = this.customerSession.session;
    protected readonly restaurant = signal<RestaurantDTO | null>(null);
    protected readonly currency = computed(() => this.restaurant()?.currency ?? null);

    protected notes = '';

    private cartSub: Subscription | null = null;
    private joinedSessionId: number | null = null;
    private joinedTableId: number | null = null;

    async ngOnInit(): Promise<void> {
        const s = this.session();
        if (!s) {
            const token = this.route.snapshot.paramMap.get('token');
            this.router.navigate(['/t', token ?? '']);
            return;
        }
        this.notes = this.checkoutDraft.notes();

        this.customerService.getRestaurant(s.restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) this.restaurant.set(res.value);
            },
        });

        const sessionId = this.tableSession.session()?.id;
        if (sessionId) {
            this.joinedSessionId = sessionId;
            await this.realtime.joinSession(sessionId);
            this.tableSession.getById(sessionId).subscribe({
                next: (res) => {
                    if (res.isSuccess) this.tableSession.setSession(res.value);
                },
            });
        }

        this.cartSub = this.realtime.sessionCartUpdated$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((latest) => {
                const local = this.tableSession.session();
                if (local && local.id === latest.id) this.tableSession.setSession(latest);
            });

        this.realtime.reconnected$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                const local = this.tableSession.session();
                if (!local) return;
                this.tableSession.getById(local.id).subscribe({
                    next: (res) => {
                        if (res.isSuccess) this.tableSession.setSession(res.value);
                    },
                });
            });

        const token = this.route.snapshot.paramMap.get('token') ?? '';
        this.joinedTableId = s.tableId;
        await this.realtime.joinTable(s.tableId);
        this.realtime.tableLobbyChanged$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                if (state.tableId !== s.tableId) return;
                if (state.stage === 'Tracking' && state.orderId) {
                    this.tableSession.clear();
                    this.checkoutDraft.clear();
                    this.router.navigate(['/t', token, 'order', state.orderId]);
                } else if (state.stage === 'Choice') {
                    this.leaveBackToLanding(token);
                }
            });
    }

    private leaveBackToLanding(token: string): void {
        this.authService.logout().subscribe({
            next: () => {
                this.customerSession.clear();
                this.tableSession.clear();
                this.router.navigate(['/t', token]);
            },
            error: () => {
                this.customerSession.clear();
                this.tableSession.clear();
                this.router.navigate(['/t', token]);
            },
        });
    }

    async ngOnDestroy(): Promise<void> {
        this.cartSub?.unsubscribe();
        if (this.joinedSessionId !== null) {
            await this.realtime.leaveSession(this.joinedSessionId);
            this.joinedSessionId = null;
        }
        if (this.joinedTableId !== null) {
            await this.realtime.leaveTable(this.joinedTableId);
            this.joinedTableId = null;
        }
    }

    protected inc(lineId: number, current: number): void {
        const sessionId = this.tableSession.session()?.id;
        if (!sessionId) return;
        this.tableSession.setLineQuantity(sessionId, lineId, current + 1).subscribe({
            next: (res) => res.isSuccess && this.tableSession.setSession(res.value),
        });
    }

    protected dec(lineId: number, current: number): void {
        const sessionId = this.tableSession.session()?.id;
        if (!sessionId) return;
        this.tableSession.setLineQuantity(sessionId, lineId, Math.max(0, current - 1)).subscribe({
            next: (res) => res.isSuccess && this.tableSession.setSession(res.value),
        });
    }

    protected remove(lineId: number): void {
        const sessionId = this.tableSession.session()?.id;
        if (!sessionId) return;
        this.tableSession.removeLine(sessionId, lineId).subscribe({
            next: (res) => res.isSuccess && this.tableSession.setSession(res.value),
        });
    }

    protected back(): void {
        const token = this.route.snapshot.paramMap.get('token');
        this.router.navigate(['/t', token ?? '', 'menu']);
    }

    protected proceedToPayment(): void {
        if (this.tableSession.cartCount() === 0) return;
        this.checkoutDraft.setNotes(this.notes.trim());
        const token = this.route.snapshot.paramMap.get('token');
        this.router.navigate(['/t', token ?? '', 'payment']);
    }
}
