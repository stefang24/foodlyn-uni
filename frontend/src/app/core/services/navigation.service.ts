import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { APP_ROUTES } from '../constants/routes.constant';
import { ROLES } from '../constants/roles.constant';
import { AuthService } from '../../shared/services/auth.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private readonly router: Router = inject(Router);
    private readonly auth: AuthService = inject(AuthService);

    goToHome(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.HOME]);
    }

    goToDashboard(): Promise<boolean> {
        const role = this.auth.currentUser()?.role;
        switch (role) {
            case ROLES.SUPER_ADMIN:
                return this.router.navigate([APP_ROUTES.ADMIN]);
            case ROLES.MANAGER:
                return this.router.navigate([APP_ROUTES.MANAGER]);
            case ROLES.CASHIER:
                return this.router.navigate([APP_ROUTES.CASHIER]);
            case ROLES.COOK:
                return this.router.navigate([APP_ROUTES.KITCHEN]);
            case ROLES.WAITER:
                return this.router.navigate([APP_ROUTES.WAITER]);
            case ROLES.STATUS_DISPLAY:
                return this.router.navigate([APP_ROUTES.STATUS_DISPLAY]);
            case ROLES.USER:
                return this.router.navigate(['/restaurants']);
            default:
                return this.router.navigate([APP_ROUTES.HOME]);
        }
    }

    goToProfile(): Promise<boolean> {
        return this.router.navigate(['/profile']);
    }

    goToLogin(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.LOGIN]);
    }

    goToForbidden(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.FORBIDDEN]);
    }

    goToServerError(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.SERVER_ERROR]);
    }

    goToKitchen(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.KITCHEN]);
    }

    goToWaiter(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.WAITER]);
    }

    goToCashier(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.CASHIER]);
    }

    goToManager(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.MANAGER]);
    }

    goToManagerMenu(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.MANAGER_MENU]);
    }

    goToManagerTables(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.MANAGER_TABLES]);
    }

    goToManagerHistory(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.MANAGER_HISTORY]);
    }

    goToAdmin(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.ADMIN]);
    }

    goToAdminRestaurants(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.ADMIN_RESTAURANTS]);
    }

    goToAdminUsers(): Promise<boolean> {
        return this.router.navigate([APP_ROUTES.ADMIN_USERS]);
    }
}
