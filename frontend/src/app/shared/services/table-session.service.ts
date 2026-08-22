import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '../models/result.model';
import {
    AddCartLineDTO,
    ScanQrDTO,
    ScanResultDTO,
    StartSessionDTO,
    TableAccessDTO,
    TableSessionDTO,
} from '../models/sessionDTO.model';
import { AuthService } from './auth.service';
import { OrderRealtimeService } from './order-realtime.service';

const SESSION_KEY = 'foodlyn_table_session';

@Injectable({ providedIn: 'root' })
export class TableSessionService {
    private readonly http = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly realtime = inject(OrderRealtimeService);
    private readonly apiUrl = `${environment.apiUrl}/sessions`;

    private readonly _session = signal<TableSessionDTO | null>(this.readFromStorage());

    readonly session = this._session.asReadonly();
    readonly cart = computed(() => this._session()?.cartLines ?? []);
    readonly cartCount = computed(() =>
        this._session()?.cartLines.reduce((s, l) => s + l.quantity, 0) ?? 0,
    );
    readonly cartTotal = computed(() => {
        const lines = this._session()?.cartLines ?? [];
        return lines.reduce((sum, l) => {
            const mods = l.modifiers.reduce((m, x) => m + x.price, 0);
            return sum + (l.unitPrice + mods) * l.quantity;
        }, 0);
    });

    scan(dto: ScanQrDTO): Observable<Result<ScanResultDTO>> {
        return this.http.post<Result<ScanResultDTO>>(`${this.apiUrl}/scan`, dto);
    }

    access(token: string): Observable<Result<TableAccessDTO>> {
        return this.http.get<Result<TableAccessDTO>>(`${this.apiUrl}/access/${token}`, {
            withCredentials: true,
        });
    }

    startGuest(dto: StartSessionDTO): Observable<Result<TableSessionDTO>> {
        return this.http
            .post<Result<TableSessionDTO>>(`${this.apiUrl}/start-guest`, dto, {
                withCredentials: true,
            })
            .pipe(
                tap((res) => {
                    if (res.isSuccess) {
                        void this.realtime.stop();
                        this.authService.loadCurrentUser().subscribe();
                    }
                }),
            );
    }

    startUser(dto: StartSessionDTO): Observable<Result<TableSessionDTO>> {
        return this.http
            .post<Result<TableSessionDTO>>(`${this.apiUrl}/start-user`, dto)
            .pipe(
                tap((res) => {
                    if (res.isSuccess) {
                        void this.realtime.stop();
                        this.authService.loadCurrentUser().subscribe();
                    }
                }),
            );
    }

    getById(id: number): Observable<Result<TableSessionDTO>> {
        return this.http.get<Result<TableSessionDTO>>(`${this.apiUrl}/${id}`);
    }

    getForTable(tableId: number): Observable<Result<TableSessionDTO>> {
        return this.http.get<Result<TableSessionDTO>>(`${this.apiUrl}/for-table/${tableId}`);
    }

    addLine(sessionId: number, dto: AddCartLineDTO): Observable<Result<TableSessionDTO>> {
        return this.http.post<Result<TableSessionDTO>>(`${this.apiUrl}/${sessionId}/cart`, dto);
    }

    setLineQuantity(sessionId: number, lineId: number, quantity: number): Observable<Result<TableSessionDTO>> {
        return this.http.put<Result<TableSessionDTO>>(
            `${this.apiUrl}/${sessionId}/cart/${lineId}`,
            { quantity },
        );
    }

    removeLine(sessionId: number, lineId: number): Observable<Result<TableSessionDTO>> {
        return this.http.delete<Result<TableSessionDTO>>(`${this.apiUrl}/${sessionId}/cart/${lineId}`);
    }

    clearCart(sessionId: number): Observable<Result<TableSessionDTO>> {
        return this.http.post<Result<TableSessionDTO>>(`${this.apiUrl}/${sessionId}/cart/clear`, {});
    }

    closeSession(sessionId: number): Observable<Result<TableSessionDTO>> {
        return this.http.post<Result<TableSessionDTO>>(`${this.apiUrl}/${sessionId}/close`, {});
    }

    restartByQr(dto: ScanQrDTO): Observable<Result<boolean>> {
        return this.http.post<Result<boolean>>(`${this.apiUrl}/restart`, dto);
    }

    setSession(session: TableSessionDTO | null): void {
        this._session.set(session);
        try {
            if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            else sessionStorage.removeItem(SESSION_KEY);
        } catch {
        }
    }

    clear(): void {
        this.setSession(null);
    }

    private readFromStorage(): TableSessionDTO | null {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? (JSON.parse(raw) as TableSessionDTO) : null;
        } catch {
            return null;
        }
    }
}
