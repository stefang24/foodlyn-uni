import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { NavigationService } from '../services/navigation.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const navigation = inject(NavigationService);

    const authReq = req.clone({ withCredentials: true });

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !isAuthEndpoint(req.url)) {
                return handle401(authReq, next, authService, navigation);
            }

            if (error.status === 403) {
                navigation.goToForbidden();
            }

            if (error.status >= 500) {
                navigation.goToServerError();
            }

            return throwError(() => error);
        })
    );
};

function isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/login') || url.includes('/auth/refresh');
}

function handle401(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
    authService: AuthService,
    navigation: NavigationService
): Observable<HttpEvent<unknown>> {
    if (isRefreshing) {
        return refreshSubject.pipe(
            filter(result => result !== null),
            take(1),
            switchMap(success => {
                if (success) return next(req);
                return throwError(() => new Error('Refresh failed'));
            })
        );
    }

    isRefreshing = true;
    refreshSubject.next(null);

    return authService.refreshToken().pipe(
        switchMap(() => {
            isRefreshing = false;
            refreshSubject.next(true);
            return next(req);
        }),
        catchError(err => {
            isRefreshing = false;
            refreshSubject.next(false);
            authService.clearSession();
            navigation.goToLogin();
            return throwError(() => err);
        })
    );
}
