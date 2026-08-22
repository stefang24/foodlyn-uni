import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { OrderService } from '../../services/order.service';
import { Menu } from '../../services/menu.service';
import { OrderDTO, OrderItemDTO } from '../../models/orderDTO.model';
import { MenuItemDTO } from '../../models/menuDTO.model';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

interface ItemView {
    item: OrderItemDTO;
    imageUrl: string | null;
    lineTotal: number;
    modifiersTotal: number;
    groupedModifiers: { groupName: string; mods: { name: string; price: number }[] }[];
}

@Component({
    selector: 'app-order-detail-dialog',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, DatePipe, DialogModule, ImageUrlPipe],
    templateUrl: './order-detail-dialog.html',
    styleUrl: './order-detail-dialog.scss',
})
export class OrderDetailDialog {
    private readonly orderService = inject(OrderService);
    private readonly menuService = inject(Menu);

    readonly visible = input<boolean>(false);
    readonly orderId = input<number | null>(null);
    readonly orderSeed = input<OrderDTO | null>(null);
    readonly close = output<void>();

    protected readonly order = signal<OrderDTO | null>(null);
    protected readonly loading = signal(false);
    protected readonly imageMap = signal<Map<number, MenuItemDTO>>(new Map());

    protected readonly itemViews = computed<ItemView[]>(() => {
        const o = this.order();
        if (!o) return [];
        const map = this.imageMap();
        return o.items.map((it) => {
            const menuItem = map.get(it.menuItemId);
            const modifiersTotal = it.modifiers.reduce((sum, m) => sum + (m.price ?? 0), 0);
            const lineTotal = (it.price + modifiersTotal) * it.quantity;
            const groupedModifiers = this.groupModifiers(it);
            return {
                item: it,
                imageUrl: menuItem?.thumbnailUrl ?? menuItem?.imageUrl ?? null,
                lineTotal,
                modifiersTotal,
                groupedModifiers,
            };
        });
    });

    protected readonly itemsTotal = computed(() =>
        this.itemViews().reduce((s, v) => s + v.lineTotal, 0),
    );

    protected readonly statusClass = computed(() => {
        const s = this.order()?.status?.toLowerCase() ?? '';
        return `s-${s}`;
    });

    protected readonly placedByLabel = computed(() => {
        const o = this.order();
        if (!o) return '';
        if (o.customerFullName && o.customerUsername) return `${o.customerFullName} (@${o.customerUsername})`;
        if (o.customerUsername) return `@${o.customerUsername}`;
        if (o.customerFullName) return o.customerFullName;
        if (o.customerName) return o.customerName;
        if (o.createdBy && o.createdBy > 0) return `Member #${o.createdBy}`;
        return 'Guest order';
    });

    constructor() {
        effect(() => {
            const visible = this.visible();
            const id = this.orderId();
            const seed = this.orderSeed();

            if (!visible) {
                this.order.set(null);
                this.imageMap.set(new Map());
                return;
            }
            if (seed) this.order.set(seed);
            if (id != null) this.loadOrder(id);
            else if (seed) this.loadMenu(seed);
        });
    }

    protected onVisibleChange(value: boolean): void {
        if (!value) this.close.emit();
    }

    private loadOrder(id: number): void {
        this.loading.set(true);
        this.orderService.getById(id).subscribe({
            next: (res) => {
                this.loading.set(false);
                if (res.isSuccess) {
                    this.order.set(res.value);
                    this.loadMenu(res.value);
                }
            },
            error: () => this.loading.set(false),
        });
    }

    private loadMenu(order: OrderDTO): void {
        if (!order.restaurantId) return;
        this.menuService.getForOrder(order.restaurantId).subscribe({
            next: (res) => {
                if (!res.isSuccess) return;
                const map = new Map<number, MenuItemDTO>();
                for (const menu of res.value) {
                    for (const cat of menu.categories) {
                        for (const item of cat.items) {
                            map.set(item.id, item);
                        }
                    }
                }
                this.imageMap.set(map);
            },
        });
    }

    private groupModifiers(item: OrderItemDTO): ItemView['groupedModifiers'] {
        const groups = new Map<string, { name: string; price: number }[]>();
        for (const m of item.modifiers) {
            const key = m.groupName || 'Options';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push({ name: m.name, price: m.price });
        }
        return Array.from(groups.entries()).map(([groupName, mods]) => ({ groupName, mods }));
    }
}
