import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { NavigationService } from '../services/navigation.service';

export const authGuard: CanActivateFn = (route) => {
    const authService = inject(AuthService);
    const navigation = inject(NavigationService);

    if (!authService.isAuthenticated()) {
        navigation.goToLogin();
        return false;
    }

    const requiredRoles = route.data?.['roles'] as string[];
    if (requiredRoles && !requiredRoles.includes(authService.currentUser()?.role ?? '')) {
        navigation.goToLogin();
        return false;
    }

    return true;
};
