import { ErrorHandler, inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ClientLogService } from '../../shared/services/client-log.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    private readonly clientLog = inject(ClientLogService);

    handleError(error: unknown): void {
        try {
            if (error instanceof HttpErrorResponse) {
                console.error(error);
                return;
            }

            const err = this.unwrap(error);
            const message = this.extractMessage(err);
            const stack = err instanceof Error ? err.stack : undefined;

            this.clientLog.log({
                message,
                stack,
                level: 'Error',
            });
        } catch {
        }

        console.error(error);
    }

    private unwrap(error: unknown): unknown {
        const e = error as { rejection?: unknown };
        if (e && typeof e === 'object' && 'rejection' in e && e.rejection) {
            return e.rejection;
        }
        return error;
    }

    private extractMessage(error: unknown): string {
        if (error instanceof Error) return error.message || error.name;
        if (typeof error === 'string') return error;
        if (error && typeof error === 'object') {
            const e = error as { message?: string };
            if (typeof e.message === 'string' && e.message) return e.message;
            try {
                return JSON.stringify(error);
            } catch {
                return 'Unknown error';
            }
        }
        return 'Unknown error';
    }
}
