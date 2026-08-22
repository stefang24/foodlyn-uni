import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { NavigationService } from '../services/navigation.service';
import { ROLES } from '../constants/roles.constant';

export const homeGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const navigation = inject(NavigationService);

    if (!authService.isAuthenticated()) return true;

    const role = authService.currentUser()?.role;
    if (role === ROLES.GUEST) return true;

    navigation.goToDashboard();
    return false;
};
