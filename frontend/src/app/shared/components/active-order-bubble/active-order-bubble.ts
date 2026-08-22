import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { ActiveOrderService } from '../../services/active-order.service';
import { CustomerSessionService } from '../../services/customer-session.service';
import { OrderService } from '../../services/order.service';
import { FileUploadService } from '../../services/file-upload.service';
import { OrderDTO } from '../../models/orderDTO.model';

@Component({
    selector: 'app-active-order-bubble',
    imports: [],
    templateUrl: './active-order-bubble.html',
    styleUrl: './active-order-bubble.scss',
})
export class ActiveOrderBubble {
    private readonly active = inject(ActiveOrderService);
    private readonly customerSession = inject(CustomerSessionService);
    private readonly orderService = inject(OrderService);
    private readonly fileUpload = inject(FileUploadService);
    private readonly router = inject(Router);

    private readonly currentUrl = toSignal(
        this.router.events.pipe(
            filter((e): e is NavigationEnd => e instanceof NavigationEnd),
            map((e) => e.urlAfterRedirects),
            startWith(this.router.url),
        ),
        { initialValue: this.router.url },
    );

    protected readonly orders = this.active.orders;

    protected readonly visible = computed(() => {
        if (this.orders().length === 0) return false;
        const url = this.currentUrl();
        if (!url) return true;
        if (url.startsWith('/login') || url.startsWith('/register')) return false;
        return true;
    });

    protected isOnTrackerOf(order: OrderDTO): boolean {
        const url = this.currentUrl();
        if (!url) return false;
        if (url.startsWith(`/track/${order.id}`)) return true;
        const m = /^\/t\/[^/]+\/order\/(\d+)/.exec(url);
        return !!m && Number(m[1]) === order.id;
    }

    protected logoFor(order: OrderDTO): string | null {
        return this.fileUpload.resolveUrl(this.active.restaurantFor(order)?.logoUrl);
    }

    protected initialFor(order: OrderDTO): string {
        const name = this.active.restaurantFor(order)?.name ?? '';
        return name.charAt(0).toUpperCase() || '?';
    }

    protected statusFor(order: OrderDTO): string {
        switch (order.status) {
            case 'Placed':
                return 'Awaiting approval';
            case 'Approved':
                return 'Approved';
            case 'Preparing':
                return 'Preparing';
            case 'Ready':
                return 'Ready';
            case 'Served':
                return 'Enjoy your meal';
            case 'AwaitingPayment':
                return 'Awaiting payment';
            default:
                return '';
        }
    }

    protected open(order: OrderDTO): void {
        const session = this.customerSession.session();
        const sessionMatches = session && session.tableId === order.tableId;
        const tokenFromUrl = this.tokenFromUrl();

        if (sessionMatches && tokenFromUrl) {
            this.router.navigate(['/t', tokenFromUrl, 'order', order.id]);
            return;
        }

        this.orderService.getReturnLink(order.id).subscribe({
            next: (res) => {
                if (res.isSuccess && res.value?.qrToken) {
                    this.router.navigate(['/t', res.value.qrToken, 'order', order.id]);
                } else {
                    this.router.navigate(['/track', order.id]);
                }
            },
            error: () => this.router.navigate(['/track', order.id]),
        });
    }

    private tokenFromUrl(): string | null {
        const match = /\/t\/([^/]+)/.exec(this.router.url);
        return match ? match[1] : null;
    }
}
