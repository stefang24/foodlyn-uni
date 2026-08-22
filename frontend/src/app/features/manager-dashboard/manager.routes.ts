import { Routes } from '@angular/router';

export const MANAGER_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
    },
    {
        path: 'live-orders',
        loadComponent: () =>
            import('./pages/live-orders-page/live-orders-page').then((m) => m.LiveOrdersPage),
    },
    {
        path: 'orders',
        loadComponent: () =>
            import('./pages/orders-page/orders-page').then((m) => m.OrdersPage),
    },
    {
        path: 'menu',
        loadComponent: () =>
            import('./pages/menu-management-page/menu-management-page').then(
                (m) => m.MenuManagementPage,
            ),
    },
    {
        path: 'restaurants',
        loadComponent: () =>
            import('./pages/restaurants-page/restaurants-page').then((m) => m.RestaurantsPage),
    },
    {
        path: 'tables',
        loadComponent: () => import('./pages/tables-page/tables-page').then((m) => m.TablesPage),
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./pages/users-page/users-page').then((m) => m.UsersPage),
    },
    {
        path: 'history',
        redirectTo: 'orders',
        pathMatch: 'full',
    },
];
