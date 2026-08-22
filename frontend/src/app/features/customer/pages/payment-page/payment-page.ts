import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NotifyService } from '../../../../shared/services/notify.service';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableSessionService } from '../../../../shared/services/table-session.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { ActiveOrderService } from '../../../../shared/services/active-order.service';
import { CustomerSessionService } from '../../../../shared/services/customer-session.service';
import { CheckoutDraftService } from '../../../../shared/services/checkout-draft.service';
import { CustomerService } from '../../../../shared/services/customer.service';
import { OrderService } from '../../../../shared/services/order.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { CreateOrderDTO } from '../../../../shared/models/orderDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

const LOAD_KEY = 'payAndOrder';

type PayMethod = 'card' | 'cash';

@Component({
    selector: 'app-payment-page',
    imports: [CurrencyPipe, ReactiveFormsModule, InputTextModule],
    templateUrl: './payment-page.html',
    styleUrl: './payment-page.scss',
})
export class PaymentPage implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly orderService = inject(OrderService);
    private readonly customerService = inject(CustomerService);
    private readonly customerSession = inject(CustomerSessionService);
    private readonly checkoutDraft = inject(CheckoutDraftService);
    private readonly messageService = inject(NotifyService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly authService = inject(AuthService);
    private readonly activeOrders = inject(ActiveOrderService);
    private readonly destroyRef = inject(DestroyRef);
    protected readonly tableSession = inject(TableSessionService);
    protected readonly loadingService = inject(LoadingService);

    private joinedTableId: number | null = null;

    protected readonly LOAD_KEY = LOAD_KEY;
    protected readonly session = this.customerSession.session;
    protected readonly partySize = this.customerSession.partySize;
    protected readonly restaurant = signal<RestaurantDTO | null>(null);
    protected readonly currency = computed(() => this.restaurant()?.currency ?? null);
    protected readonly method = signal<PayMethod>('card');

    protected readonly cardForm: FormGroup = this.fb.group({
        cardNumber: ['', [Validators.required, Validators.pattern(/^(\d{4}\s?){4}$/)]],
        cardHolder: ['', [Validators.required, Validators.maxLength(80)]],
        expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
        cvc: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
    });

    protected readonly cardNumberRaw = signal('');
    protected readonly cardHolderRaw = signal('');
    protected readonly cardExpiryRaw = signal('');

    protected readonly cardMaskedPreview = computed(() => {
        const digits = this.cardNumberRaw().replace(/\D/g, '').padEnd(16, '•');
        return digits.match(/.{1,4}/g)?.join(' ') ?? '';
    });

    protected onCardNumberInput(value: string): void {
        const digits = value.replace(/\D/g, '').slice(0, 16);
        const formatted = digits.match(/.{1,4}/g)?.join(' ') ?? digits;
        this.cardForm.patchValue({ cardNumber: formatted });
        this.cardNumberRaw.set(formatted);
    }

    protected onCardHolderInput(value: string): void {
        this.cardForm.patchValue({ cardHolder: value });
        this.cardHolderRaw.set(value);
    }

    protected onExpiryInput(value: string): void {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
        this.cardForm.patchValue({ expiry: formatted });
        this.cardExpiryRaw.set(formatted);
    }

    protected onCvcInput(value: string): void {
        const digits = value.replace(/\D/g, '').slice(0, 3);
        this.cardForm.patchValue({ cvc: digits });
    }

    protected isCardInvalid(field: string): boolean {
        const c = this.cardForm.get(field);
        return !!(c && c.invalid && (c.dirty || c.touched));
    }

    async ngOnInit(): Promise<void> {
        const s = this.session();
        const token = this.route.snapshot.paramMap.get('token');
        if (!s) {
            this.router.navigate(['/t', token ?? '']);
            return;
        }
        if (this.tableSession.cartCount() === 0) {
            this.router.navigate(['/t', token ?? '', 'menu']);
            return;
        }
        this.customerService.getRestaurant(s.restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) this.restaurant.set(res.value);
            },
        });

        this.joinedTableId = s.tableId;
        await this.realtime.joinTable(s.tableId);
        this.realtime.tableLobbyChanged$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                if (state.tableId !== s.tableId) return;
                if (state.stage === 'Tracking' && state.orderId) {
                    this.router.navigate(['/t', token ?? '', 'order', state.orderId]);
                } else if (state.stage === 'Choice') {
                    this.authService.logout().subscribe({
                        next: () => this.afterLogoutToLanding(token ?? ''),
                        error: () => this.afterLogoutToLanding(token ?? ''),
                    });
                }
            });
    }

    private afterLogoutToLanding(token: string): void {
        this.customerSession.clear();
        this.tableSession.clear();
        this.router.navigate(['/t', token]);
    }

    async ngOnDestroy(): Promise<void> {
        if (this.joinedTableId !== null) {
            await this.realtime.leaveTable(this.joinedTableId);
            this.joinedTableId = null;
        }
    }

    protected pick(m: PayMethod): void {
        this.method.set(m);
    }

    protected back(): void {
        const token = this.route.snapshot.paramMap.get('token');
        this.router.navigate(['/t', token ?? '', 'cart']);
    }

    protected proceed(): void {
        const s = this.session();
        const tableSession = this.tableSession.session();
        if (!s || !tableSession) return;
        if (this.tableSession.cartCount() === 0) return;

        if (this.method() === 'card') {
            this.cardForm.markAllAsTouched();
            if (this.cardForm.invalid) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Card details',
                    detail: 'Please fill in valid card details.',
                    life: 3000,
                });
                return;
            }
        }

        const party = this.partySize() ?? 1;
        const dto: CreateOrderDTO = {
            tableId: s.tableId,
            sessionId: tableSession.id,
            deliveryNotes: this.checkoutDraft.notes() || null,
            customerName: null,
            partySize: party,
            paymentMethod: this.method() === 'card' ? 'Card' : 'Cash',
            items: [],
        };

        this.loadingService.start(LOAD_KEY);
        this.orderService
            .create(dto)
            .pipe(finalize(() => this.loadingService.stop(LOAD_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.tableSession.clear();
                        this.checkoutDraft.clear();
                        this.activeOrders.refresh();
                        const token = this.route.snapshot.paramMap.get('token');
                        this.router.navigate(['/t', token ?? '', 'order', res.value.id]);
                    } else {
                        this.handleOrderError(res.error ?? 'Could not place order');
                    }
                },
                error: (err) => {
                    this.handleOrderError(err?.error?.error ?? 'Could not place order');
                },
            });
    }

    private handleOrderError(rawError: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: rawError,
            life: 3000,
        });
    }
}
