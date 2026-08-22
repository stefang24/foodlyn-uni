import { CurrencyPipe, DatePipe } from '@angular/common';
import { NotifyService } from '../../../../shared/services/notify.service';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize, interval } from 'rxjs';
import { AuthService } from '../../../../shared/services/auth.service';
import { OrderService } from '../../../../shared/services/order.service';
import { OrderRealtimeService } from '../../../../shared/services/order-realtime.service';
import { SoundService } from '../../../../shared/services/sound.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { OrderDTO } from '../../../../shared/models/orderDTO.model';
import { OrderDetailDialog } from '../../../../shared/components/order-detail-dialog/order-detail-dialog';

const LOAD_KEY = 'kitchenQueue';

@Component({
    selector: 'app-kds-page',
    imports: [FormsModule, CurrencyPipe, DatePipe, OrderDetailDialog],
    templateUrl: './kds-page.html',
    styleUrl: './kds-page.scss',
})
export class KdsPage implements OnInit, OnDestroy {
    private readonly auth = inject(AuthService);
    private readonly orderService = inject(OrderService);
    private readonly realtime = inject(OrderRealtimeService);
    protected readonly sound = inject(SoundService);
    private readonly messageService = inject(NotifyService);
    protected readonly loadingService = inject(LoadingService);

    protected readonly LOAD_KEY = LOAD_KEY;
    protected readonly orders = signal<OrderDTO[]>([]);
    protected readonly now = signal(Date.now());

    protected readonly detailOpen = signal(false);
    protected readonly detailOrderId = signal<number | null>(null);
    protected readonly detailSeed = signal<OrderDTO | null>(null);

    openDetail(o: OrderDTO): void {
        this.detailSeed.set(o);
        this.detailOrderId.set(o.id);
        this.detailOpen.set(true);
    }

    closeDetail(): void {
        this.detailOpen.set(false);
        this.detailOrderId.set(null);
        this.detailSeed.set(null);
    }
    protected readonly prepChoices = [5, 10, 15, 20, 30];
    protected readonly customPrep: Record<number, number | null> = {};
    protected readonly selectedPrep = signal<Record<number, number>>({});

    protected readonly approved = computed(() =>
        this.orders().filter((o) => o.status === 'Approved'),
    );
    protected readonly preparing = computed(() =>
        this.orders().filter((o) => o.status === 'Preparing'),
    );

    private createdSub: Subscription | null = null;
    private updatedSub: Subscription | null = null;
    private removedSub: Subscription | null = null;
    private tickerSub: Subscription | null = null;
    private reconnectedSub: Subscription | null = null;
    private restaurantId = 0;

    async ngOnInit(): Promise<void> {
        const rId = this.auth.currentUser()?.restaurantId;
        if (!rId) {
            this.messageService.add({
                severity: 'error',
                summary: 'No restaurant',
                detail: 'Your account has no restaurant assigned.',
                life: 3000,
            });
            return;
        }
        this.restaurantId = rId;

        this.createdSub = this.realtime.created$.subscribe((o) => {
            let isNew = false;
            this.orders.update((list) => {
                if (list.some((x) => x.id === o.id)) return list;
                isNew = true;
                return [o, ...list];
            });
            if (isNew && o.status === 'Approved') this.sound.playOrderToPrepare();
        });
        this.updatedSub = this.realtime.updated$.subscribe((o) => {
            this.orders.update((list) => {
                const idx = list.findIndex((x) => x.id === o.id);
                if (idx >= 0) {
                    const next = [...list];
                    next[idx] = o;
                    return next;
                }
                return [o, ...list];
            });
        });
        this.removedSub = this.realtime.removed$.subscribe((id) => {
            this.orders.update((list) => list.filter((x) => x.id !== id));
        });

        this.tickerSub = interval(200).subscribe(() => this.now.set(Date.now()));
        this.reconnectedSub = this.realtime.reconnected$.subscribe(() => this.loadQueue());

        try {
            await this.realtime.joinStaff('kitchen', rId);
        } catch {
        }

        this.loadQueue();
    }

    private loadQueue(): void {
        this.loadingService.start(LOAD_KEY);
        this.orderService
            .getKitchenQueue(this.restaurantId)
            .pipe(finalize(() => this.loadingService.stop(LOAD_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) this.orders.set(res.value);
                },
            });
    }

    async ngOnDestroy(): Promise<void> {
        this.createdSub?.unsubscribe();
        this.updatedSub?.unsubscribe();
        this.removedSub?.unsubscribe();
        this.tickerSub?.unsubscribe();
        this.reconnectedSub?.unsubscribe();
        if (this.restaurantId) {
            await this.realtime.leaveStaff('kitchen', this.restaurantId);
        }
    }

    protected selectChip(orderId: number, minutes: number): void {
        this.selectedPrep.update((m) => ({ ...m, [orderId]: minutes }));
        this.customPrep[orderId] = null;
    }

    protected isSelected(orderId: number, minutes: number): boolean {
        return this.selectedPrep()[orderId] === minutes;
    }

    protected onCustomChange(orderId: number): void {
        if (this.customPrep[orderId]) {
            this.selectedPrep.update((m) => {
                const { [orderId]: _, ...rest } = m;
                return rest;
            });
        }
    }

    protected effectivePrep(orderId: number): number {
        return this.customPrep[orderId] || this.selectedPrep()[orderId] || 0;
    }

    protected start(o: OrderDTO): void {
        const minutes = this.effectivePrep(o.id);
        if (!minutes || minutes < 1 || minutes > 240) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Pick a time',
                detail: 'Choose a prep time first (1-240 min).',
                life: 3000,
            });
            return;
        }
        this.orderService.startPreparing(o.id, { prepTimeMinutes: minutes }).subscribe({
            next: (res) => {
                if (!res.isSuccess) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Start failed',
                        life: 3000,
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Start failed',
                    life: 3000,
                });
            },
        });
    }

    protected markReady(o: OrderDTO): void {
        this.orderService.markReady(o.id).subscribe({
            next: (res) => {
                if (!res.isSuccess) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Mark ready failed',
                        life: 3000,
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Mark ready failed',
                    life: 3000,
                });
            },
        });
    }

    protected remainingLabel(o: OrderDTO): string {
        if (!o.preparingStartedAt || !o.prepTimeMinutes) return '--:--';
        const start = Date.parse(o.preparingStartedAt);
        const totalMs = o.prepTimeMinutes * 60 * 1000;
        const remainingMs = Math.max(0, start + totalMs - this.now());
        if (remainingMs === 0) return 'Soon';
        const m = Math.floor(remainingMs / 60000);
        const s = Math.floor((remainingMs % 60000) / 1000);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    protected progressPct(o: OrderDTO): number {
        if (!o.preparingStartedAt || !o.prepTimeMinutes) return 0;
        const start = Date.parse(o.preparingStartedAt);
        const totalMs = o.prepTimeMinutes * 60 * 1000;
        const elapsed = this.now() - start;
        return Math.max(0, Math.min(100, (elapsed / totalMs) * 100));
    }
}
