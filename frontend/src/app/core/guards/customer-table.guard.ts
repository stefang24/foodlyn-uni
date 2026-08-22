import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TableSessionService } from '../../shared/services/table-session.service';

export const customerTableGuard: CanActivateFn = (route) => {
    const tableSession = inject(TableSessionService);
    const router = inject(Router);

    const token =
        route.paramMap.get('token') ??
        route.parent?.paramMap.get('token') ??
        route.root.firstChild?.paramMap.get('token') ??
        null;

    if (!token) {
        return router.createUrlTree(['/']);
    }

    const requiresMembership = (route.data?.['requiresSessionMembership'] as boolean | undefined) ?? true;

    return tableSession.access(token).pipe(
        map((res) => {
            if (!res.isSuccess) return router.createUrlTree(['/t', token]);
            const info = res.value;

            if (info.blockedByOtherUser || info.blockedByActiveOrder) {
                return router.createUrlTree(['/t', token]);
            }

            if (requiresMembership && !info.isSessionMember) {
                return router.createUrlTree(['/t', token]);
            }

            return true;
        }),
        catchError(() => of(router.createUrlTree(['/t', token]))),
    );
};
