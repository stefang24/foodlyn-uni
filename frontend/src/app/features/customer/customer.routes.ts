import { Routes } from '@angular/router';
import { customerTableGuard } from '../../core/guards/customer-table.guard';

export const CUSTOMER_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/qr-landing-page/qr-landing-page').then((m) => m.QrLandingPage),
    },
    {
        path: 'party',
        loadComponent: () =>
            import('./pages/party-size-page/party-size-page').then((m) => m.PartySizePage),
        canActivate: [customerTableGuard],
        data: { requiresSessionMembership: false },
    },
    {
        path: 'menu',
        loadComponent: () =>
            import('./pages/customer-menu-page/customer-menu-page').then((m) => m.CustomerMenuPage),
        canActivate: [customerTableGuard],
    },
    {
        path: 'cart',
        loadComponent: () => import('./pages/cart-page/cart-page').then((m) => m.CartPage),
        canActivate: [customerTableGuard],
    },
    {
        path: 'payment',
        loadComponent: () =>
            import('./pages/payment-page/payment-page').then((m) => m.PaymentPage),
        canActivate: [customerTableGuard],
    },
    {
        path: 'tracking',
        loadComponent: () =>
            import('./pages/order-tracker-page/order-tracker-page').then((m) => m.OrderTrackerPage),
    },
    {
        path: 'order/:id',
        loadComponent: () =>
            import('./pages/order-tracker-page/order-tracker-page').then((m) => m.OrderTrackerPage),
    },
];
