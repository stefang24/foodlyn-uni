import { Routes } from '@angular/router';

export const GUEST_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/menu-page/menu-page').then((m) => m.MenuPage),
    },
    {
        path: 'cart',
        loadComponent: () => import('./pages/cart-page/cart-page').then((m) => m.CartPage),
    },
    {
        path: 'status',
        loadComponent: () =>
            import('./pages/order-status-page/order-status-page').then((m) => m.OrderStatusPage),
    },
];
