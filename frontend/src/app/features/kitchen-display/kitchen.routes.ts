import { Routes } from '@angular/router';

export const KITCHEN_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/kds-page/kds-page').then((m) => m.KdsPage),
    },
];
