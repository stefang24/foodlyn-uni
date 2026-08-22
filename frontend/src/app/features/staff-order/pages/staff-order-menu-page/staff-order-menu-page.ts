import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { MenuItemCard } from '../../../../shared/components/menu-item-card/menu-item-card';
import { Menu } from '../../../../shared/services/menu.service';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { StaffCartModifier, StaffCartService } from '../../../../shared/services/staff-cart.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { NotifyService } from '../../../../shared/services/notify.service';
import { MenuDTO, MenuItemDTO } from '../../../../shared/models/menuDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

const LOAD_KEY = 'staffOrderMenu';

@Component({
    selector: 'app-staff-order-menu-page',
    imports: [
        FormsModule,
        CurrencyPipe,
        ButtonModule,
        DialogModule,
        InputTextModule,
        MenuItemCard,
    ],
    templateUrl: './staff-order-menu-page.html',
    styleUrl: './staff-order-menu-page.scss',
})
export class StaffOrderMenuPage implements OnInit {
    private readonly menuService = inject(Menu);
    private readonly restaurantService = inject(Restaurant);
    private readonly router = inject(Router);
    private readonly notify = inject(NotifyService);
    protected readonly staffCart = inject(StaffCartService);
    protected readonly loadingService = inject(LoadingService);
    protected readonly LOAD_KEY = LOAD_KEY;

    protected readonly menus = signal<MenuDTO[]>([]);
    protected readonly selectedMenuId = signal<number | null>(null);
    protected readonly selectedMenu = computed(
        () => this.menus().find((m) => m.id === this.selectedMenuId()) ?? null,
    );
    protected readonly restaurant = signal<RestaurantDTO | null>(null);
    protected readonly restaurantCurrency = computed(() => this.restaurant()?.currency ?? null);

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

    ngOnInit(): void {
        const ctx = this.staffCart.context();
        if (!ctx) {
            this.router.navigate(['/staff-order']);
            return;
        }
        this.restaurantService.getById(ctx.restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) this.restaurant.set(res.value);
            },
        });
        this.loadingService.start(LOAD_KEY);
        this.menuService
            .getForOrder(ctx.restaurantId)
            .pipe(finalize(() => this.loadingService.stop(LOAD_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.menus.set(res.value);
                        if (res.value.length > 0) this.selectedMenuId.set(res.value[0].id);
                    } else {
                        this.notify.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not load menu',
                            life: 3000,
                        });
                    }
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
        const notes = this.dialogNotes().trim();

        const selected = this.dialogSelectedModIds();
        const cartMods: StaffCartModifier[] = [];
        for (const g of item.modifierGroups ?? []) {
            for (const m of g.modifiers) {
                if (selected.has(m.id)) {
                    cartMods.push({ id: m.id, groupName: g.name, name: m.name, price: m.priceDelta });
                }
            }
        }

        this.staffCart.add(item, qty, notes.length > 0 ? notes : null, cartMods, this.restaurantCurrency());
        this.dialogOpen.set(false);
        this.notify.add({
            severity: 'success',
            summary: 'Added',
            detail: `${qty} × ${item.name}`,
            life: 1500,
        });
    }

    protected goToCart(): void {
        this.router.navigate(['/staff-order/cart']);
    }

    protected back(): void {
        this.router.navigate(['/staff-order']);
    }
}
