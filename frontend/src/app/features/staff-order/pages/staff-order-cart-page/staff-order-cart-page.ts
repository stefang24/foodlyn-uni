import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { OrderService } from '../../../../shared/services/order.service';
import { StaffCartService } from '../../../../shared/services/staff-cart.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { NotifyService } from '../../../../shared/services/notify.service';
import { CreateOrderDTO, PaymentMethod } from '../../../../shared/models/orderDTO.model';

const SUBMIT_KEY = 'staffOrderSubmit';

@Component({
    selector: 'app-staff-order-cart-page',
    imports: [CurrencyPipe, FormsModule, ButtonModule, SelectModule],
    templateUrl: './staff-order-cart-page.html',
    styleUrl: './staff-order-cart-page.scss',
})
export class StaffOrderCartPage implements OnInit {
    private readonly orderService = inject(OrderService);
    private readonly router = inject(Router);
    private readonly notify = inject(NotifyService);
    protected readonly staffCart = inject(StaffCartService);
    protected readonly loadingService = inject(LoadingService);
    protected readonly SUBMIT_KEY = SUBMIT_KEY;

    protected customerName = signal<string>('');
    protected partySize = signal<number>(1);
    protected notes = signal<string>('');
    protected paymentMethod = signal<PaymentMethod | null>(null);

    protected readonly paymentOptions = [
        { label: 'Cash', value: 'Cash' as PaymentMethod },
        { label: 'Card', value: 'Card' as PaymentMethod },
        { label: 'Decide later', value: null as PaymentMethod | null },
    ];

    ngOnInit(): void {
        if (!this.staffCart.context()) {
            this.router.navigate(['/staff-order']);
        }
    }

    protected inc(lineKey: string, current: number): void {
        this.staffCart.setQuantity(lineKey, current + 1);
    }

    protected dec(lineKey: string, current: number): void {
        if (current <= 1) {
            this.staffCart.remove(lineKey);
        } else {
            this.staffCart.setQuantity(lineKey, current - 1);
        }
    }

    protected remove(lineKey: string): void {
        this.staffCart.remove(lineKey);
    }

    protected back(): void {
        this.router.navigate(['/staff-order/menu']);
    }

    private orderErrorText(code: string | null | undefined): string {
        if (code === 'TABLE_NOT_AVAILABLE')
            return 'This table is being cleaned or is out of service.';
        return code || 'Could not place order';
    }

    protected submit(): void {
        const ctx = this.staffCart.context();
        if (!ctx || this.staffCart.isEmpty()) return;

        const dto: CreateOrderDTO = {
            tableId: ctx.tableId,
            sessionId: null,
            deliveryNotes: this.notes().trim() || null,
            customerName: this.customerName().trim() || null,
            partySize: Math.max(1, this.partySize()),
            paymentMethod: this.paymentMethod(),
            items: this.staffCart.lines().map((l) => ({
                menuItemId: l.menuItemId,
                quantity: l.quantity,
                notes: l.notes,
                modifierIds: l.modifiers.map((m) => m.id),
            })),
        };

        this.loadingService.start(SUBMIT_KEY);
        this.orderService
            .create(dto)
            .pipe(finalize(() => this.loadingService.stop(SUBMIT_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.staffCart.clear();
                        this.notify.add({
                            severity: 'success',
                            summary: 'Order placed',
                            detail: `Order #${res.value.id} created for table #${ctx.tableNumber}`,
                            life: 3000,
                        });
                        this.router.navigate(['/staff-order']);
                    } else {
                        this.notify.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: this.orderErrorText(res.error),
                            life: 3500,
                        });
                    }
                },
                error: (err) => {
                    this.notify.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: this.orderErrorText(err?.error?.error),
                        life: 3500,
                    });
                },
            });
    }
}
