import { Routes } from '@angular/router';

export const STAFF_ORDER_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/staff-order-pick-page/staff-order-pick-page').then(
                (m) => m.StaffOrderPickPage,
            ),
    },
    {
        path: 'menu',
        loadComponent: () =>
            import('./pages/staff-order-menu-page/staff-order-menu-page').then(
                (m) => m.StaffOrderMenuPage,
            ),
    },
    {
        path: 'cart',
        loadComponent: () =>
            import('./pages/staff-order-cart-page/staff-order-cart-page').then(
                (m) => m.StaffOrderCartPage,
            ),
    },
];
