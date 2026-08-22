import { Routes } from '@angular/router';

export const PUBLIC_RESTAURANT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/restaurant-page/restaurant-page').then((m) => m.RestaurantPage),
    },
    {
        path: 'menu',
        redirectTo: '',
        pathMatch: 'full',
    },
];
