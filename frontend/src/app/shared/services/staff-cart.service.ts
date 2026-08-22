import { computed, Injectable, signal } from '@angular/core';
import { MenuItemDTO } from '../models/menuDTO.model';

export interface StaffCartModifier {
    id: number;
    groupName: string;
    name: string;
    price: number;
}

export interface StaffCartLine {
    lineKey: string;
    menuItemId: number;
    name: string;
    price: number;
    currency: string | null;
    quantity: number;
    notes: string | null;
    imageUrl: string | null;
    modifiers: StaffCartModifier[];
}

export interface StaffCartContext {
    restaurantId: number;
    restaurantName: string;
    tableId: number;
    tableNumber: number;
    tableLabel: string | null;
}

const LINES_KEY = 'foodlyn_staff_cart_lines';
const CONTEXT_KEY = 'foodlyn_staff_cart_context';

function buildLineKey(
    menuItemId: number,
    notes: string | null,
    modifiers: StaffCartModifier[],
): string {
    const modIds = modifiers
        .map((m) => m.id)
        .sort((a, b) => a - b)
        .join(',');
    return `${menuItemId}|${notes ?? ''}|${modIds}`;
}

@Injectable({ providedIn: 'root' })
export class StaffCartService {
    private readonly _lines = signal<StaffCartLine[]>(this.readLinesFromStorage());
    private readonly _context = signal<StaffCartContext | null>(this.readContextFromStorage());

    lines = this._lines.asReadonly();
    context = this._context.asReadonly();

    itemCount = computed(() => this._lines().reduce((sum, l) => sum + l.quantity, 0));
    total = computed(() =>
        this._lines().reduce(
            (sum, l) => sum + (l.price + l.modifiers.reduce((s, m) => s + m.price, 0)) * l.quantity,
            0,
        ),
    );
    currency = computed(() => this._lines()[0]?.currency ?? 'USD');
    isEmpty = computed(() => this._lines().length === 0);

    setContext(ctx: StaffCartContext): void {
        const current = this._context();
        if (current && (current.restaurantId !== ctx.restaurantId || current.tableId !== ctx.tableId)) {
            this.commitLines([]);
        }
        this._context.set(ctx);
        sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
    }

    clearContext(): void {
        this._context.set(null);
        sessionStorage.removeItem(CONTEXT_KEY);
    }

    add(
        item: MenuItemDTO,
        quantity: number,
        notes: string | null = null,
        modifiers: StaffCartModifier[] = [],
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
        this.commitLines(lines);
    }

    setQuantity(lineKey: string, quantity: number): void {
        let lines = this._lines().map((l) =>
            l.lineKey === lineKey ? { ...l, quantity: Math.max(0, quantity) } : l,
        );
        lines = lines.filter((l) => l.quantity > 0);
        this.commitLines(lines);
    }

    remove(lineKey: string): void {
        const lines = this._lines().filter((l) => l.lineKey !== lineKey);
        this.commitLines(lines);
    }

    clear(): void {
        this.commitLines([]);
        this.clearContext();
    }

    private commitLines(lines: StaffCartLine[]): void {
        this._lines.set(lines);
        if (lines.length === 0) sessionStorage.removeItem(LINES_KEY);
        else sessionStorage.setItem(LINES_KEY, JSON.stringify(lines));
    }

    private readLinesFromStorage(): StaffCartLine[] {
        try {
            const raw = sessionStorage.getItem(LINES_KEY);
            const parsed = raw ? (JSON.parse(raw) as StaffCartLine[]) : [];
            return parsed.map((l) => ({
                ...l,
                modifiers: l.modifiers ?? [],
                lineKey: l.lineKey ?? buildLineKey(l.menuItemId, l.notes, l.modifiers ?? []),
            }));
        } catch {
            return [];
        }
    }

    private readContextFromStorage(): StaffCartContext | null {
        try {
            const raw = sessionStorage.getItem(CONTEXT_KEY);
            return raw ? (JSON.parse(raw) as StaffCartContext) : null;
        } catch {
            return null;
        }
    }
}
