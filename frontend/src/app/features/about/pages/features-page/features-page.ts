import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth.service';

interface FeatureGroup {
    title: string;
    icon: string;
    items: { icon: string; name: string; desc: string }[];
}

@Component({
    selector: 'app-features-page',
    imports: [],
    templateUrl: './features-page.html',
    styleUrl: './features-page.scss',
})
export class FeaturesPage {
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);

    protected readonly isLoggedIn = computed(() => this.auth.currentUser() !== null);

    protected readonly groups: FeatureGroup[] = [
        {
            title: 'For guests',
            icon: 'pi-users',
            items: [
                {
                    icon: 'pi-qrcode',
                    name: 'QR scan & order',
                    desc: 'Scan the table QR, browse the menu, send the order to the kitchen - all from your phone, no app install.',
                },
                {
                    icon: 'pi-book',
                    name: 'Live menu',
                    desc: 'Real-time item availability, discounts and dietary badges (Veg, Vegan, GF). Sold-out items are disabled automatically.',
                },
                {
                    icon: 'pi-shopping-cart',
                    name: 'Smart cart',
                    desc: 'Edit quantities, add per-item notes and split party size before you even flag down a waiter.',
                },
                {
                    icon: 'pi-clock',
                    name: 'Order tracking',
                    desc: 'Placed → Approved → Preparing → Ready → Served. Live status ring with ETA based on kitchen prep time.',
                },
                {
                    icon: 'pi-bell',
                    name: 'Call waiter',
                    desc: 'One tap opens a call with optional note. Waiter receives a live notification tied to the table number.',
                },
                {
                    icon: 'pi-check-circle',
                    name: 'Finished eating',
                    desc: 'Guests close their own table when they leave.',
                },
            ],
        },
        {
            title: 'For managers',
            icon: 'pi-briefcase',
            items: [
                {
                    icon: 'pi-objects-column',
                    name: 'Stats dashboard',
                    desc: 'Today\'s revenue, active orders, occupied tables, avg order value, 7-day chart, most sold foods.',
                },
                {
                    icon: 'pi-bolt',
                    name: 'Live orders kanban',
                    desc: 'Columns by status: Placed / Approved / Preparing / Ready / Served / Awaiting Payment.',
                },
                {
                    icon: 'pi-book',
                    name: 'Menu management',
                    desc: 'Menus, categories, items, images, allergens, discounted pricing, feature/new/unavailable flags.',
                },
                {
                    icon: 'pi-shop',
                    name: 'Restaurants',
                    desc: 'Sidebar of your branches, tabbed management per restaurant: Tables, Users, Opening Hours, Location, Settings.',
                },
                {
                    icon: 'pi-list',
                    name: 'Orders archive',
                    desc: 'Full orders table with sort and filter by status, payment method and date range. Click for full detail.',
                },
                {
                    icon: 'pi-table',
                    name: 'Tables & QR',
                    desc: 'Bulk create tables, rotate QR tokens, view live table status across the floor.',
                },
            ],
        },
        {
            title: 'For cashiers',
            icon: 'pi-wallet',
            items: [
                {
                    icon: 'pi-check',
                    name: 'Approve / reject',
                    desc: 'Review placed orders with reject reasons. Kitchen queue only picks up approved tickets.',
                },
                {
                    icon: 'pi-credit-card',
                    name: 'Card & cash flows',
                    desc: 'Card pays immediately; cash follows the Awaiting Payment → Completed flow with automatic table clearing.',
                },
                {
                    icon: 'pi-sparkles',
                    name: 'Mark cleaned',
                    desc: 'Tables auto-transition to Cleaning after payment. One tap returns them to Free for the next guest.',
                },
            ],
        },
        {
            title: 'For waiters',
            icon: 'pi-bell',
            items: [
                {
                    icon: 'pi-list',
                    name: 'Ready queue',
                    desc: 'Live board of orders ready to serve. One tap marks the order served and flips the table to Eating.',
                },
                {
                    icon: 'pi-comments',
                    name: 'Table calls',
                    desc: 'Real-time notifications of guest calls with optional note. Acknowledge from the floor.',
                },
                {
                    icon: 'pi-refresh',
                    name: 'Real-time updates',
                    desc: 'Everything is driven by live updates - no manual refreshing during service.',
                },
            ],
        },
        {
            title: 'For cooks',
            icon: 'pi-stopwatch',
            items: [
                {
                    icon: 'pi-th-large',
                    name: 'Kitchen display',
                    desc: 'Tickets grouped by status with item modifiers and allergen notes surfaced up front.',
                },
                {
                    icon: 'pi-clock',
                    name: 'Prep timer',
                    desc: 'Start preparing with a prep-time estimate; guests see the live countdown on their phones.',
                },
                {
                    icon: 'pi-flag-fill',
                    name: 'Ready in one tap',
                    desc: 'Flag orders as ready; waiters get notified instantly.',
                },
            ],
        },
    ];

    back(): void {
        if (this.auth.currentUser()) this.router.navigate(['/restaurants']);
        else this.router.navigate(['/']);
    }

    register(): void {
        this.router.navigate(['/register']);
    }
}
