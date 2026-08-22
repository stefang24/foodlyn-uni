import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { Layout } from './core/layout/layout';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { homeGuard } from './core/guards/home.guard';
import { ROLES } from './core/constants/roles.constant';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home/pages/home/home').then((m) => m.Home),
        canActivate: [homeGuard],
    },
    {
        path: 't/:token',
        loadChildren: () =>
            import('./features/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
    },
    {
        path: 'restaurants',
        loadComponent: () =>
            import(
                './features/public-restaurant/pages/restaurants-list-page/restaurants-list-page'
            ).then((m) => m.RestaurantsListPage),
    },
    {
        path: 'r/:slug',
        loadChildren: () =>
            import('./features/public-restaurant/public.routes').then(
                (m) => m.PUBLIC_RESTAURANT_ROUTES,
            ),
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/pages/login/login').then((m) => m.Login),
        canActivate: [noAuthGuard],
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./features/auth/register/pages/register/register').then((m) => m.Register),
        canActivate: [noAuthGuard],
    },
    {
        path: 'verify-email',
        loadComponent: () =>
            import('./features/auth/verify-email/pages/verify-email/verify-email').then(
                (m) => m.VerifyEmail,
            ),
        canActivate: [noAuthGuard],
    },
    {
        path: 'profile',
        loadComponent: () =>
            import('./features/profile/pages/profile-page/profile-page').then(
                (m) => m.ProfilePage,
            ),
        canActivate: [authGuard],
    },
    {
        path: 'track/:id',
        loadComponent: () =>
            import(
                './features/customer/pages/order-tracker-page/order-tracker-page'
            ).then((m) => m.OrderTrackerPage),
        canActivate: [authGuard],
    },
    {
        path: 'status',
        loadComponent: () =>
            import('./features/status-display/pages/status-display-page/status-display-page').then(
                (m) => m.StatusDisplayPage,
            ),
        canActivate: [authGuard],
        data: { roles: [ROLES.STATUS_DISPLAY, ROLES.SUPER_ADMIN, ROLES.MANAGER] },
    },
    {
        path: 'about',
        loadComponent: () =>
            import('./features/about/pages/about-page/about-page').then((m) => m.AboutPage),
    },
    {
        path: 'features',
        loadComponent: () =>
            import('./features/about/pages/features-page/features-page').then(
                (m) => m.FeaturesPage,
            ),
    },
    {
        path: 'terms',
        loadComponent: () =>
            import('./features/legal/pages/terms-page/terms-page').then((m) => m.TermsPage),
    },
    {
        path: 'privacy',
        loadComponent: () =>
            import('./features/legal/pages/privacy-page/privacy-page').then((m) => m.PrivacyPage),
    },
    {
        path: '',
        component: Layout,
        canActivate: [authGuard],
        children: [
            {
                path: 'kitchen',
                loadChildren: () =>
                    import('./features/kitchen-display/kitchen.routes').then(
                        (m) => m.KITCHEN_ROUTES,
                    ),
                canActivate: [authGuard],
                data: { roles: [ROLES.COOK, ROLES.SUPER_ADMIN, ROLES.MANAGER] },
            },
            {
                path: 'waiter',
                loadChildren: () =>
                    import('./features/waiter-panel/waiter.routes').then((m) => m.WAITER_ROUTES),
                canActivate: [authGuard],
                data: { roles: [ROLES.WAITER, ROLES.SUPER_ADMIN, ROLES.MANAGER] },
            },
            {
                path: 'cashier',
                loadChildren: () =>
                    import('./features/cashier-panel/cashier.routes').then(
                        (m) => m.CASHIER_ROUTES,
                    ),
                canActivate: [authGuard],
                data: { roles: [ROLES.CASHIER, ROLES.SUPER_ADMIN, ROLES.MANAGER] },
            },
            {
                path: 'manager',
                loadChildren: () =>
                    import('./features/manager-dashboard/manager.routes').then(
                        (m) => m.MANAGER_ROUTES,
                    ),
                canActivate: [authGuard],
                data: { roles: [ROLES.MANAGER, ROLES.SUPER_ADMIN] },
            },
            {
                path: 'admin',
                loadChildren: () =>
                    import('./features/super-admin/admin.routes').then((m) => m.ADMIN_ROUTES),
                canActivate: [authGuard],
                data: { roles: [ROLES.SUPER_ADMIN] },
            },
            {
                path: 'staff-order',
                loadChildren: () =>
                    import('./features/staff-order/staff-order.routes').then(
                        (m) => m.STAFF_ORDER_ROUTES,
                    ),
                canActivate: [authGuard],
                data: {
                    roles: [
                        ROLES.WAITER,
                        ROLES.CASHIER,
                        ROLES.MANAGER,
                        ROLES.SUPER_ADMIN,
                    ],
                },
            },
        ],
    },
    {
        path: 'forbidden',
        loadComponent: () =>
            import('./features/errors/forbidden/forbidden').then((m) => m.Forbidden),
    },
    {
        path: 'server-error',
        loadComponent: () =>
            import('./features/errors/server-error/server-error').then((m) => m.ServerError),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
