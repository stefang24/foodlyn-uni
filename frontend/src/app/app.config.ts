import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './shared/services/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorLogInterceptor } from './core/interceptors/error-log.interceptor';
import { GlobalErrorHandler } from './core/handlers/global-error.handler';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor, errorLogInterceptor])),
        providePrimeNG({
            theme: {
                preset: Aura,
                options: {
                    darkModeSelector: '.my-app-dark'
                }
            },
        }),
        provideAppInitializer(() => {
            const auth = inject(AuthService);
            if (!auth.hasAuthFlag()) {
                return Promise.resolve();
            }
            return firstValueFrom(auth.loadCurrentUser());
        }),
    ],
};
