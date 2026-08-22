import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../../../core/services/navigation.service';

@Component({
    selector: 'app-home',
    imports: [],
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export class Home {
    private readonly navigation: NavigationService = inject(NavigationService);
    private readonly router = inject(Router);

    private readonly featuresSection = viewChild<ElementRef<HTMLElement>>('featuresSection');

    protected readonly opened = signal(false);

    toggleSideBar(): void {
        this.opened.update((v) => !v);
    }

    @HostListener('document:click', ['$event'])
    onDocClick(event: MouseEvent): void {
        if (!this.opened()) return;
        const target = event.target as HTMLElement | null;
        if (!target) return;
        if (target.closest('.dropdown-menu') || target.closest('#dots')) return;
        this.opened.set(false);
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.opened()) this.opened.set(false);
    }

    goToLogin(): void {
        this.navigation.goToLogin();
    }

    goToRegister(): void {
        this.router.navigate(['/register']);
    }

    goToHome(): void {
        this.navigation.goToHome();
    }

    goToFeatures(): void {
        this.router.navigate(['/features']);
    }

    goToAbout(): void {
        this.router.navigate(['/about']);
    }

    getStarted(): void {
        this.router.navigate(['/register']);
    }

    learnMore(): void {
        this.featuresSection()?.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }

    browseRestaurants(): void {
        this.router.navigate(['/restaurants']);
    }

    allRestaurants(): void {
        this.router.navigate(['/restaurants']);
    }
}
