import { Routes } from '@angular/router';

export const WAITER_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/waiter-page/waiter-page').then((m) => m.WaiterPage),
    },
];
