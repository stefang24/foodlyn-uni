import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
    private readonly loadingKeys = signal<ReadonlySet<string>>(new Set());

    start(key: string): void {
        this.loadingKeys.update((set) => {
            const next = new Set(set);
            next.add(key);
            return next;
        });
    }

    stop(key: string): void {
        this.loadingKeys.update((set) => {
            const next = new Set(set);
            next.delete(key);
            return next;
        });
    }

    isLoading(key: string): boolean {
        return this.loadingKeys().has(key);
    }
}
