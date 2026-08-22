import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export const SKIP_ERROR_LOG = new HttpContextToken<boolean>(() => false);

export interface ClientLogPayload {
    message: string;
    level?: 'Error' | 'Warning' | 'Info';
    stack?: string;
    url?: string;
    statusCode?: number;
    method?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientLogService {
    private readonly http = inject(HttpClient);
    private readonly endpoint = `${environment.apiUrl}/logs/client`;

    private readonly recent = new Map<string, number>();
    private readonly dedupeWindowMs = 5000;
    private readonly maxRecent = 50;

    log(payload: ClientLogPayload): void {
        const key = `${payload.level ?? 'Error'}|${payload.message}|${payload.url ?? ''}|${payload.statusCode ?? ''}`;
        const now = Date.now();
        const last = this.recent.get(key);
        if (last !== undefined && now - last < this.dedupeWindowMs) return;

        if (this.recent.size >= this.maxRecent) {
            const firstKey = this.recent.keys().next().value;
            if (firstKey !== undefined) this.recent.delete(firstKey);
        }
        this.recent.set(key, now);

        const body: ClientLogPayload = {
            message: this.cap(payload.message, 4000) || 'Unknown error',
            level: payload.level ?? 'Error',
            stack: this.cap(payload.stack, 8000),
            url: this.cap(payload.url ?? (typeof window !== 'undefined' ? window.location.href : undefined), 500),
            statusCode: payload.statusCode,
            method: this.cap(payload.method, 10),
        };

        const context = new HttpContext().set(SKIP_ERROR_LOG, true);
        firstValueFrom(
            this.http.post(this.endpoint, body, { withCredentials: true, context }),
        ).catch(() => {});
    }

    private cap(value: string | undefined, max: number): string | undefined {
        if (!value) return value;
        return value.length <= max ? value : value.substring(0, max);
    }
}
