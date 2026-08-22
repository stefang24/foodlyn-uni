import { Injectable, signal } from '@angular/core';
import { TableQrResolveDTO } from '../models/tableDTO.model';

const SESSION_KEY = 'foodlyn_customer_session';
const PARTY_KEY = 'foodlyn_customer_party';

@Injectable({ providedIn: 'root' })
export class CustomerSessionService {
    private readonly _session = signal<TableQrResolveDTO | null>(this.readSession());
    private readonly _partySize = signal<number | null>(this.readPartySize());

    session = this._session.asReadonly();
    partySize = this._partySize.asReadonly();

    set(data: TableQrResolveDTO): void {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
        this._session.set(data);
    }

    setPartySize(size: number): void {
        sessionStorage.setItem(PARTY_KEY, String(size));
        this._partySize.set(size);
    }

    clear(): void {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(PARTY_KEY);
        this._session.set(null);
        this._partySize.set(null);
    }

    private readSession(): TableQrResolveDTO | null {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? (JSON.parse(raw) as TableQrResolveDTO) : null;
        } catch {
            return null;
        }
    }

    private readPartySize(): number | null {
        const raw = sessionStorage.getItem(PARTY_KEY);
        const n = raw ? parseInt(raw, 10) : NaN;
        return Number.isFinite(n) && n > 0 ? n : null;
    }
}
