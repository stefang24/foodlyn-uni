import { CurrencyPipe } from '@angular/common';
import {
    AfterViewInit,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    OnInit,
    QueryList,
    signal,
    ViewChildren,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { Restaurant, OpeningHourDTO } from '../../../../shared/services/restaurant.service';
import { Menu } from '../../../../shared/services/menu.service';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';
import { MenuCategoryDTO, MenuDTO, MenuItemDTO } from '../../../../shared/models/menuDTO.model';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

interface CategoryView {
    menuId: number;
    menuName: string;
    category: MenuCategoryDTO;
    anchorId: string;
}

@Component({
    selector: 'app-restaurant-page',
    imports: [CurrencyPipe, FormsModule, DialogModule, ImageUrlPipe],
    templateUrl: './restaurant-page.html',
    styleUrl: './restaurant-page.scss',
})
export class RestaurantPage implements OnInit, AfterViewInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly menuService: Menu = inject(Menu);
    private readonly destroyRef = inject(DestroyRef);

    @ViewChildren('catBlock') private catBlocks?: QueryList<ElementRef<HTMLElement>>;

    protected readonly restaurant = signal<RestaurantDTO | null>(null);
    protected readonly menus = signal<MenuDTO[]>([]);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);
    protected readonly query = signal('');
    protected readonly activeAnchor = signal<string | null>(null);
    protected readonly openingHours = signal<OpeningHourDTO[]>([]);
    protected readonly detailsOpen = signal(false);

    protected readonly DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    protected readonly DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

    protected readonly todayHours = computed(() => {
        const today = new Date().getDay();
        const day = this.openingHours().find((d) => d.dayOfWeek === today);
        if (!day || !day.isOpen || !day.openTime || !day.closeTime) return 'Closed today';
        return `${day.openTime} – ${day.closeTime}`;
    });

    protected hoursForDay(dayOfWeek: number): OpeningHourDTO {
        return (
            this.openingHours().find((d) => d.dayOfWeek === dayOfWeek) ?? {
                dayOfWeek,
                isOpen: false,
                openTime: null,
                closeTime: null,
            }
        );
    }

    protected crossesMidnight(open: string | null, close: string | null): boolean {
        if (!open || !close) return false;
        return close < open;
    }

    protected isToday(dayOfWeek: number): boolean {
        return new Date().getDay() === dayOfWeek;
    }

    protected openDetails(): void {
        this.detailsOpen.set(true);
    }

    protected closeDetails(): void {
        this.detailsOpen.set(false);
    }

    protected readonly currency = computed(() => this.restaurant()?.currency || 'USD');

    protected readonly categories = computed<CategoryView[]>(() => {
        const list: CategoryView[] = [];
        for (const menu of this.menus()) {
            for (const cat of menu.categories ?? []) {
                if (cat.items.length === 0) continue;
                list.push({
                    menuId: menu.id,
                    menuName: menu.name,
                    category: cat,
                    anchorId: `cat-${menu.id}-${cat.id}`,
                });
            }
        }
        return list;
    });

    protected readonly filteredCategories = computed<CategoryView[]>(() => {
        const q = this.query().trim().toLowerCase();
        if (!q) return this.categories();
        const match = (item: MenuItemDTO) =>
            item.name.toLowerCase().includes(q) ||
            (item.description?.toLowerCase().includes(q) ?? false) ||
            (item.tags ?? []).some((t) => t.toLowerCase().includes(q));

        return this.categories()
            .map((cv) => ({
                ...cv,
                category: { ...cv.category, items: cv.category.items.filter(match) },
            }))
            .filter((cv) => cv.category.items.length > 0);
    });

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
                if (r.isSuccess) {
                    this.restaurant.set(r.value);
                    this.loadOpeningHours(r.value.id);
                } else {
                    this.error.set(r.error ?? 'Restaurant not found');
                }
                if (m.isSuccess) this.menus.set(m.value ?? []);
            },
            error: () => {
                this.loading.set(false);
                this.error.set('Could not load restaurant');
            },
        });
    }

    private loadOpeningHours(restaurantId: number): void {
        this.restaurantService.getOpeningHours(restaurantId).subscribe({
            next: (res) => {
                if (res.isSuccess) this.openingHours.set(res.value);
            },
        });
    }

    ngAfterViewInit(): void {
        const THRESHOLD = 140;
        let rafId = 0;
        let isProgrammaticScroll = false;
        let programmaticTimer: ReturnType<typeof setTimeout> | null = null;

        const recompute = () => {
            rafId = 0;
            if (isProgrammaticScroll) return;
            const blocks = this.catBlocks?.toArray() ?? [];
            if (blocks.length === 0) return;

            let activeId: string | null = null;
            for (const block of blocks) {
                const el = block.nativeElement;
                const top = el.getBoundingClientRect().top;
                if (top - THRESHOLD <= 1) {
                    activeId = el.id;
                } else {
                    break;
                }
            }

            if (activeId === null) {
                const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
                if (nearBottom) {
                    activeId = blocks[blocks.length - 1].nativeElement.id;
                } else {
                    activeId = blocks[0].nativeElement.id;
                }
            }

            if (activeId !== this.activeAnchor()) {
                this.activeAnchor.set(activeId);
            }
        };

        const onScroll = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(recompute);
        };

        this.beginProgrammaticScroll = () => {
            isProgrammaticScroll = true;
            if (programmaticTimer) clearTimeout(programmaticTimer);
            programmaticTimer = setTimeout(() => {
                isProgrammaticScroll = false;
                recompute();
            }, 600);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        this.catBlocks?.changes.subscribe(() => queueMicrotask(recompute));
        queueMicrotask(recompute);

        this.destroyRef.onDestroy(() => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (rafId) cancelAnimationFrame(rafId);
            if (programmaticTimer) clearTimeout(programmaticTimer);
        });
    }

    private beginProgrammaticScroll: () => void = () => {};

    back(): void {
        this.router.navigate(['/restaurants']);
    }

    scrollTo(anchorId: string): void {
        const el = document.getElementById(anchorId);
        if (!el) return;
        this.activeAnchor.set(anchorId);
        this.beginProgrammaticScroll();
        const y = el.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }

    priceFor(item: MenuItemDTO): number {
        return item.discountedPrice ?? item.price;
    }

    hasDiscount(item: MenuItemDTO): boolean {
        return item.discountedPrice != null && item.discountedPrice < item.price;
    }
}
