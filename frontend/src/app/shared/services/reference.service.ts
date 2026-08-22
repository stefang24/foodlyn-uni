import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '../models/result.model';

export interface CurrencyDTO {
    code: string;
    name: string;
    symbol: string | null;
    rateToEur: number;
    isActive: boolean;
}

export interface TimezoneDTO {
    ianaName: string;
    displayName: string;
    isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReferenceService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/reference`;

    private readonly _currencies = signal<CurrencyDTO[]>([]);
    private readonly _timezones = signal<TimezoneDTO[]>([]);

    readonly currencies = this._currencies.asReadonly();
    readonly timezones = this._timezones.asReadonly();

    getCurrencies(force = false): Observable<Result<CurrencyDTO[]>> {
        if (!force && this._currencies().length > 0) {
            return of({ isSuccess: true, value: this._currencies(), error: null } as Result<CurrencyDTO[]>);
        }
        return this.http.get<Result<CurrencyDTO[]>>(`${this.apiUrl}/currencies`).pipe(
            tap((res) => {
                if (res.isSuccess) this._currencies.set(res.value);
            }),
        );
    }

    getAllCurrencies(): Observable<Result<CurrencyDTO[]>> {
        return this.http.get<Result<CurrencyDTO[]>>(`${this.apiUrl}/currencies/all`);
    }

    updateRate(code: string, rateToEur: number): Observable<Result<CurrencyDTO>> {
        return this.http
            .put<Result<CurrencyDTO>>(`${this.apiUrl}/currencies/${code}/rate`, { rateToEur })
            .pipe(
                tap((res) => {
                    if (res.isSuccess) {
                        this._currencies.update((list) =>
                            list.map((c) => (c.code === res.value.code ? res.value : c)),
                        );
                    }
                }),
            );
    }

    getTimezones(force = false): Observable<Result<TimezoneDTO[]>> {
        if (!force && this._timezones().length > 0) {
            return of({ isSuccess: true, value: this._timezones(), error: null } as Result<TimezoneDTO[]>);
        }
        return this.http.get<Result<TimezoneDTO[]>>(`${this.apiUrl}/timezones`).pipe(
            tap((res) => {
                if (res.isSuccess) this._timezones.set(res.value);
            }),
        );
    }

    convert(amount: number, fromCode: string, toCode: string): number {
        if (!amount || fromCode === toCode) return amount;
        const list = this._currencies();
        if (list.length === 0) return amount;
        const from = list.find((c) => c.code === fromCode);
        const to = list.find((c) => c.code === toCode);
        if (!from || !to || from.rateToEur <= 0 || to.rateToEur <= 0) return amount;
        const amountInEur = amount / from.rateToEur;
        return amountInEur * to.rateToEur;
    }

    getSymbol(code: string | null | undefined): string {
        if (!code) return '';
        const found = this._currencies().find((c) => c.code === code);
        return found?.symbol ?? code;
    }
}
