import { computed, Injectable, signal } from '@angular/core';
import { MenuItemDTO } from '../models/menuDTO.model';

export interface CartModifier {
    id: number;
    groupName: string;
    name: string;
    price: number;
}

export interface CartLine {
    lineKey: string;
    menuItemId: number;
    name: string;
    price: number;
    currency: string | null;
    quantity: number;
    notes: string | null;
    imageUrl: string | null;
    modifiers: CartModifier[];
}

const CART_KEY = 'foodlyn_customer_cart';

function buildLineKey(menuItemId: number, notes: string | null, modifiers: CartModifier[]): string {
    const modIds = modifiers
        .map((m) => m.id)
        .sort((a, b) => a - b)
        .join(',');
    return `${menuItemId}|${notes ?? ''}|${modIds}`;
}

@Injectable({ providedIn: 'root' })
export class CartService {
    private readonly _lines = signal<CartLine[]>(this.readFromStorage());

    lines = this._lines.asReadonly();

    itemCount = computed(() => this._lines().reduce((sum, l) => sum + l.quantity, 0));

    total = computed(() =>
        this._lines().reduce(
            (sum, l) => sum + (l.price + l.modifiers.reduce((s, m) => s + m.price, 0)) * l.quantity,
            0,
        ),
    );

    currency = computed(() => this._lines()[0]?.currency ?? 'USD');

    isEmpty = computed(() => this._lines().length === 0);

    add(
        item: MenuItemDTO,
        quantity: number,
        notes: string | null = null,
        modifiers: CartModifier[] = [],
        currency: string | null = null,
    ): void {
        if (quantity <= 0) return;
        const unitPrice = item.discountedPrice ?? item.price;
        const lineKey = buildLineKey(item.id, notes, modifiers);
        const lines = [...this._lines()];
        const idx = lines.findIndex((l) => l.lineKey === lineKey);
        if (idx >= 0) {
            lines[idx] = { ...lines[idx], quantity: lines[idx].quantity + quantity };
        } else {
            lines.push({
                lineKey,
                menuItemId: item.id,
                name: item.name,
                price: unitPrice,
                currency,
                quantity,
                notes,
                imageUrl: item.imageUrl,
                modifiers,
            });
        }
        this.commit(lines);
    }

    setQuantity(lineKey: string, quantity: number): void {
        let lines = this._lines().map((l) =>
            l.lineKey === lineKey ? { ...l, quantity: Math.max(0, quantity) } : l,
        );
        lines = lines.filter((l) => l.quantity > 0);
        this.commit(lines);
    }

    remove(lineKey: string): void {
        const lines = this._lines().filter((l) => l.lineKey !== lineKey);
        this.commit(lines);
    }

    clear(): void {
        this.commit([]);
    }

    private commit(lines: CartLine[]): void {
        this._lines.set(lines);
        if (lines.length === 0) sessionStorage.removeItem(CART_KEY);
        else sessionStorage.setItem(CART_KEY, JSON.stringify(lines));
    }

    private readFromStorage(): CartLine[] {
        try {
            const raw = sessionStorage.getItem(CART_KEY);
            const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
            return parsed.map((l) => ({
                ...l,
                modifiers: l.modifiers ?? [],
                lineKey: l.lineKey ?? buildLineKey(l.menuItemId, l.notes, l.modifiers ?? []),
            }));
        } catch {
            return [];
        }
    }
}
