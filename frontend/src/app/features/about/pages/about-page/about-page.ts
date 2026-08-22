import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
    selector: 'app-about-page',
    imports: [],
    templateUrl: './about-page.html',
    styleUrl: './about-page.scss',
})
export class AboutPage {
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);

    protected readonly isLoggedIn = computed(() => this.auth.currentUser() !== null);

    back(): void {
        if (this.auth.currentUser()) this.router.navigate(['/restaurants']);
        else this.router.navigate(['/']);
    }
}
