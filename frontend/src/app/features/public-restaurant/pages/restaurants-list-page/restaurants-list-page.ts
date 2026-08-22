import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { FileUploadService } from '../../../../shared/services/file-upload.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

@Component({
    selector: 'app-restaurants-list-page',
    imports: [FormsModule, ImageUrlPipe],
    templateUrl: './restaurants-list-page.html',
    styleUrl: './restaurants-list-page.scss',
})
export class RestaurantsListPage implements OnInit {
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly auth: AuthService = inject(AuthService);
    private readonly fileUpload = inject(FileUploadService);
    private readonly router = inject(Router);

    protected readonly user = computed(() => this.auth.currentUser());
    protected readonly isLoggedIn = computed(() => this.user() !== null);

    protected readonly initials = computed(() => {
        const u = this.user();
        if (!u) return '?';
        const src = u.fullName?.trim() || u.username || u.email || '';
        const parts = src.split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });

    protected readonly photoUrl = computed(() => {
        const raw = this.user()?.profilePictureUrl;
        return raw ? this.fileUpload.resolveUrl(raw) : null;
    });

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly loading = signal(true);
    protected readonly query = signal('');
    protected readonly activeCuisine = signal<string | null>(null);

    protected readonly cuisines = computed(() => {
        const set = new Set<string>();
        for (const r of this.restaurants()) {
            if (r.cuisine) set.add(r.cuisine);
        }
        return Array.from(set).sort();
    });

    protected readonly filtered = computed(() => {
        const q = this.query().trim().toLowerCase();
        const c = this.activeCuisine();
        return this.restaurants().filter((r) => {
            if (c && r.cuisine !== c) return false;
            if (!q) return true;
            return (
                r.name.toLowerCase().includes(q) ||
                (r.cuisine?.toLowerCase().includes(q) ?? false) ||
                (r.city?.toLowerCase().includes(q) ?? false) ||
                (r.description?.toLowerCase().includes(q) ?? false)
            );
        });
    });

    ngOnInit(): void {
        this.restaurantService.getPublic().subscribe({
            next: (res) => {
                this.loading.set(false);
                if (res.isSuccess) this.restaurants.set(res.value);
            },
            error: () => this.loading.set(false),
        });
    }

    back(): void {
        this.router.navigate(['/']);
    }

    goToProfile(): void {
        this.router.navigate(['/profile']);
    }

    goToLogin(): void {
        this.router.navigate(['/login']);
    }

    goHome(): void {
        if (this.isLoggedIn()) this.router.navigate(['/restaurants']);
        else this.router.navigate(['/']);
    }

    open(slug: string): void {
        this.router.navigate(['/r', slug]);
    }

    setCuisine(c: string | null): void {
        this.activeCuisine.set(c);
    }

    cityLine(r: RestaurantDTO): string {
        const parts = [r.city, r.country].filter(Boolean);
        return parts.join(', ');
    }

    deliveryEta(r: RestaurantDTO): string {
        const base = ((r.id * 7) % 20) + 20;
        return `${base}-${base + 10} min`;
    }

    priceTier(r: RestaurantDTO): string {
        const n = (r.id % 3) + 1;
        return '$$$'.slice(0, n);
    }
}
