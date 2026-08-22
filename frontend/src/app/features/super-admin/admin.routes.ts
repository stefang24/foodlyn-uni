import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./dashboard/pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
    },
    {
        path: 'restaurants',
        loadComponent: () =>
            import('./dashboard/pages/restaurants-overview/restaurants-overview').then(
                (m) => m.RestaurantsOverview,
            ),
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./dashboard/pages/users-overview/users-overview').then((m) => m.UsersOverview),
    },
    {
        path: 'live-orders',
        loadComponent: () =>
            import('./dashboard/pages/live-orders/live-orders').then((m) => m.LiveOrders),
    },
    {
        path: 'orders',
        loadComponent: () =>
            import('../manager-dashboard/pages/orders-page/orders-page').then(
                (m) => m.OrdersPage,
            ),
    },
    {
        path: 'tables',
        loadComponent: () =>
            import('../manager-dashboard/pages/tables-page/tables-page').then(
                (m) => m.TablesPage,
            ),
    },
    {
        path: 'menu',
        loadComponent: () =>
            import('../manager-dashboard/pages/menu-management-page/menu-management-page').then(
                (m) => m.MenuManagementPage,
            ),
    },
    {
        path: 'logs',
        loadComponent: () =>
            import('./dashboard/pages/logs/logs').then((m) => m.AdminLogs),
    },
    {
        path: 'analytics',
        loadComponent: () =>
            import('../manager-dashboard/pages/dashboard-page/dashboard-page').then(
                (m) => m.DashboardPage,
            ),
    },
    {
        path: 'currencies',
        loadComponent: () =>
            import('./dashboard/pages/currencies-overview/currencies-overview').then(
                (m) => m.CurrenciesOverview,
            ),
    },
];
