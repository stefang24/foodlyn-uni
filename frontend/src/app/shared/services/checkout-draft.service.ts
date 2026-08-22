import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CheckoutDraftService {
    private readonly _notes = signal('');

    notes = this._notes.asReadonly();

    setNotes(value: string): void {
        this._notes.set(value);
    }

    clear(): void {
        this._notes.set('');
    }
}
