import { CurrencyPipe } from '@angular/common';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { Menu } from '../../../../shared/services/menu.service';
import { MenuDTO } from '../../../../shared/models/menuDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

@Component({
    selector: 'app-restaurant-menu-page',
    imports: [CurrencyPipe, ImageUrlPipe],
    templateUrl: './restaurant-menu-page.html',
    styleUrl: './restaurant-menu-page.scss',
})
export class RestaurantMenuPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly menuService: Menu = inject(Menu);

    protected readonly restaurant = signal<RestaurantDTO | null>(null);
    protected readonly menus = signal<MenuDTO[]>([]);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);

    protected readonly currency = computed(() => this.restaurant()?.currency || 'USD');

    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get('slug') ?? '';
        if (!slug) {
            this.error.set('Missing slug');
            this.loading.set(false);
            return;
        }

        forkJoin({
            r: this.restaurantService.getBySlug(slug),
            m: this.menuService.getPublicBySlug(slug),
        }).subscribe({
            next: ({ r, m }) => {
                this.loading.set(false);
                if (r.isSuccess) this.restaurant.set(r.value);
                else this.error.set(r.error ?? 'Restaurant not found');
                if (m.isSuccess) this.menus.set(m.value ?? []);
            },
            error: () => {
                this.loading.set(false);
                this.error.set('Could not load menu');
            },
        });
    }

    back(): void {
        const slug = this.route.snapshot.paramMap.get('slug') ?? '';
        this.router.navigate(['/r', slug]);
    }
}
