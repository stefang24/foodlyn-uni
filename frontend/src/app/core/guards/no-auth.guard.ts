import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { NavigationService } from '../services/navigation.service';

export const noAuthGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const navigation = inject(NavigationService);

    if (authService.isAuthenticated()) {
        navigation.goToDashboard();
        return false;
    }

    return true;
};
