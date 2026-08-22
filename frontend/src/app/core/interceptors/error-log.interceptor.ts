import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ClientLogService, SKIP_ERROR_LOG } from '../../shared/services/client-log.service';

export const errorLogInterceptor: HttpInterceptorFn = (req, next) => {
    const clientLog = inject(ClientLogService);

    return next(req).pipe(
        catchError((error: unknown) => {
            if (req.context.get(SKIP_ERROR_LOG)) {
                return throwError(() => error);
            }

            if (error instanceof HttpErrorResponse) {
                if (error.status === 0) {
                    clientLog.log({
                        message: `Network error: ${req.method} ${req.url}`,
                        stack: error.message,
                        url: req.url,
                        method: req.method,
                        statusCode: 0,
                        level: 'Error',
                    });
                }
            }

            return throwError(() => error);
        }),
    );
};
