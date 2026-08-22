import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MenuItemDTO } from '../../models/menuDTO.model';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

@Component({
    selector: 'app-menu-item-card',
    standalone: true,
    imports: [CurrencyPipe, ImageUrlPipe],
    templateUrl: './menu-item-card.html',
    styleUrl: './menu-item-card.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemCard {
    item = input.required<MenuItemDTO>();
    editable = input<boolean>(false);
    orderable = input<boolean>(false);
    currency = input<string | null>(null);

    edit = output<MenuItemDTO>();
    remove = output<MenuItemDTO>();
    order = output<MenuItemDTO>();

    protected onEdit(): void {
        this.edit.emit(this.item());
    }

    protected onRemove(): void {
        this.remove.emit(this.item());
    }

    protected onOrder(): void {
        const i = this.item();
        if (!i.isAvailable || !i.isActive) return;
        this.order.emit(i);
    }

    protected spicinessDots(level: number): number[] {
        const clamped = Math.max(0, Math.min(3, level | 0));
        return Array.from({ length: clamped });
    }

    protected dietaryBadges(item: MenuItemDTO): { label: string; icon: string }[] {
        const badges: { label: string; icon: string }[] = [];
        if (item.isVegetarian) badges.push({ label: 'Vegetarian', icon: 'pi pi-leaf' });
        if (item.isVegan) badges.push({ label: 'Vegan', icon: 'pi pi-heart' });
        if (item.isGlutenFree) badges.push({ label: 'Gluten free', icon: 'pi pi-check-circle' });
        if (item.isDairyFree) badges.push({ label: 'Dairy free', icon: 'pi pi-check-circle' });
        if (item.isHalal) badges.push({ label: 'Halal', icon: 'pi pi-verified' });
        if (item.isKosher) badges.push({ label: 'Kosher', icon: 'pi pi-verified' });
        return badges;
    }
}
