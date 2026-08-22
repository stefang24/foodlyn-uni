import { Injectable, signal } from '@angular/core';

export type NotifySeverity = 'success' | 'info' | 'warn' | 'error';

export interface NotifyMessage {
    id?: number;
    severity?: NotifySeverity;
    summary?: string;
    detail?: string;
    life?: number;
}

interface ActiveNotification extends Required<Omit<NotifyMessage, 'detail'>> {
    detail?: string;
}

@Injectable({ providedIn: 'root' })
export class NotifyService {
    private _seq = 1;
    private readonly _notifications = signal<ActiveNotification[]>([]);
    readonly notifications = this._notifications.asReadonly();

    private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

    add(message: NotifyMessage): number {
        const id = message.id ?? this._seq++;
        const item: ActiveNotification = {
            id,
            severity: message.severity ?? 'info',
            summary: message.summary ?? '',
            detail: message.detail,
            life: message.life ?? 2500,
        };
        this._notifications.update((list) => [...list, item]);

        if (item.life > 0) {
            const handle = setTimeout(() => this.dismiss(id), item.life);
            this.timers.set(id, handle);
        }
        return id;
    }

    success(summary: string, detail?: string, life = 2500): number {
        return this.add({ severity: 'success', summary, detail, life });
    }

    error(summary: string, detail?: string, life = 3500): number {
        return this.add({ severity: 'error', summary, detail, life });
    }

    info(summary: string, detail?: string, life = 2500): number {
        return this.add({ severity: 'info', summary, detail, life });
    }

    warn(summary: string, detail?: string, life = 3000): number {
        return this.add({ severity: 'warn', summary, detail, life });
    }

    dismiss(id: number): void {
        this._notifications.update((list) => list.filter((n) => n.id !== id));
        const handle = this.timers.get(id);
        if (handle) {
            clearTimeout(handle);
            this.timers.delete(id);
        }
    }

    clear(): void {
        for (const handle of this.timers.values()) clearTimeout(handle);
        this.timers.clear();
        this._notifications.set([]);
    }
}
