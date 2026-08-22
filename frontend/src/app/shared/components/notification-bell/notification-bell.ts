import {
    Component,
    computed,
    DestroyRef,
    ElementRef,
    HostListener,
    inject,
    OnDestroy,
    OnInit,
    signal,
    ViewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../services/notification.service';
import { OrderRealtimeService } from '../../services/order-realtime.service';
import { SoundService } from '../../services/sound.service';
import { NotificationDTO } from '../../models/notificationDTO.model';

const PAGE_SIZE = 10;

@Component({
    selector: 'app-notification-bell',
    standalone: true,
    imports: [DatePipe],
    templateUrl: './notification-bell.html',
    styleUrl: './notification-bell.scss',
})
export class NotificationBell implements OnInit, OnDestroy {
    private readonly notificationService = inject(NotificationService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly sound = inject(SoundService);
    private readonly destroyRef = inject(DestroyRef);

    @ViewChild('panelBody') panelBody?: ElementRef<HTMLDivElement>;

    protected readonly open = signal(false);
    protected readonly items = signal<NotificationDTO[]>([]);
    protected readonly unreadCount = signal(0);
    protected readonly loading = signal(false);
    protected readonly hasMore = signal(true);
    protected readonly page = signal(1);

    protected readonly hasUnread = computed(() => this.unreadCount() > 0);

    private createdSub: Subscription | null = null;
    private pollHandle: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        void this.realtime.start();

        this.refreshUnread();

        this.createdSub = this.realtime.notificationCreated$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((n) => {
                this.items.update((list) =>
                    list.some((x) => x.id === n.id) ? list : [n, ...list],
                );
                if (!n.isRead) {
                    this.unreadCount.update((c) => c + 1);
                    this.sound.playNewOrder();
                }
                this.refreshUnread();
            });

        this.pollHandle = setInterval(() => this.refreshUnread(), 45000);
    }

    ngOnDestroy(): void {
        this.createdSub?.unsubscribe();
        if (this.pollHandle !== null) {
            clearInterval(this.pollHandle);
            this.pollHandle = null;
        }
    }

    @HostListener('document:keydown.escape')
    onEsc(): void {
        this.open.set(false);
    }

    toggle(): void {
        const next = !this.open();
        this.open.set(next);
        if (next) this.loadFirstPage();
    }

    close(): void {
        this.open.set(false);
    }

    onScroll(event: Event): void {
        const el = event.target as HTMLDivElement;
        const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (remaining < 80 && this.hasMore() && !this.loading()) {
            this.loadMore();
        }
    }

    markRead(n: NotificationDTO, event: Event): void {
        event.stopPropagation();
        if (n.isRead) return;
        this.notificationService.markRead(n.id).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.items.update((list) =>
                        list.map((x) => (x.id === n.id ? { ...x, isRead: true, readAt: res.value.readAt } : x)),
                    );
                    this.unreadCount.update((c) => Math.max(0, c - 1));
                }
            },
        });
    }

    markAllRead(): void {
        if (this.unreadCount() === 0) return;
        this.notificationService.markAllRead().subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    const now = new Date().toISOString();
                    this.items.update((list) =>
                        list.map((x) => (x.isRead ? x : { ...x, isRead: true, readAt: now })),
                    );
                    this.unreadCount.set(0);
                }
            },
        });
    }

    private refreshUnread(): void {
        this.notificationService.getUnreadCount().subscribe({
            next: (res) => {
                if (res.isSuccess) this.unreadCount.set(res.value);
            },
        });
    }

    private loadFirstPage(): void {
        this.page.set(1);
        this.hasMore.set(true);
        this.loadPage(1, true);
    }

    private loadMore(): void {
        const next = this.page() + 1;
        this.page.set(next);
        this.loadPage(next, false);
    }

    private loadPage(page: number, replace: boolean): void {
        this.loading.set(true);
        this.notificationService.getPaged(page, PAGE_SIZE).subscribe({
            next: (res) => {
                this.loading.set(false);
                if (!res.isSuccess) return;
                const newItems = res.value.items;
                this.items.update((list) => {
                    if (replace) return newItems;
                    const seen = new Set(list.map((x) => x.id));
                    return [...list, ...newItems.filter((n) => !seen.has(n.id))];
                });
                const total = res.value.totalCount;
                const loaded = (page - 1) * PAGE_SIZE + newItems.length;
                this.hasMore.set(loaded < total && newItems.length > 0);
            },
            error: () => this.loading.set(false),
        });
    }

    protected iconFor(type: string): string {
        switch (type) {
            case 'ORDER_CREATED':
                return 'pi-shopping-cart';
            case 'ORDER_TO_PREPARE':
                return 'pi-list';
            case 'ORDER_PREPARING':
                return 'pi-clock';
            case 'ORDER_READY':
                return 'pi-bell';
            case 'WAITER_CALLED':
                return 'pi-phone';
            default:
                return 'pi-info-circle';
        }
    }
}
