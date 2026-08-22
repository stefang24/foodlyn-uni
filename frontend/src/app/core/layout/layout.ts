import {
    Component,
    computed,
    DestroyRef,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../shared/services/auth.service';
import { NavigationService } from '../services/navigation.service';
import { ROLES } from '../constants/roles.constant';
import { APP_ROUTES } from '../constants/routes.constant';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { NotificationBell } from '../../shared/components/notification-bell/notification-bell';

interface NavItem {
    label: string;
    icon: string;
    path: string;
}

interface RoleProfile {
    label: string;
    subtitle: string;
    icon: string;
    items: NavItem[];
}

@Component({
    selector: 'app-layout',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBell],
    templateUrl: './layout.html',
    styleUrl: './layout.scss',
})
export class Layout implements OnInit {
    private readonly auth = inject(AuthService);
    private readonly navigation = inject(NavigationService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly fileUpload = inject(FileUploadService);

    protected readonly avatarUrl = computed(() => {
        const raw = this.auth.currentUser()?.profilePictureUrl;
        return raw ? this.fileUpload.resolveUrl(raw) : null;
    });

    protected readonly now = signal(new Date());
    protected readonly currentUrl = signal<string>(this.router.url);

    protected readonly role = computed(() => this.auth.currentUser()?.role ?? null);

    protected readonly showsBell = computed(() => {
        const r = this.role();
        return r === ROLES.CASHIER || r === ROLES.COOK || r === ROLES.WAITER;
    });

    protected readonly profile = computed<RoleProfile>(() => {
        const r = this.role();
        switch (r) {
            case ROLES.SUPER_ADMIN:
                return {
                    label: 'Admin',
                    subtitle: 'Platform',
                    icon: 'pi-shield',
                    items: [
                        { label: 'Dashboard', icon: 'pi-objects-column', path: APP_ROUTES.ADMIN },
                        {
                            label: 'Analytics',
                            icon: 'pi-chart-bar',
                            path: APP_ROUTES.ADMIN_ANALYTICS,
                        },
                        {
                            label: 'Live orders',
                            icon: 'pi-bolt',
                            path: APP_ROUTES.ADMIN_LIVE_ORDERS,
                        },
                        {
                            label: 'Orders',
                            icon: 'pi-list',
                            path: APP_ROUTES.ADMIN_ORDERS,
                        },
                        {
                            label: 'Restaurants',
                            icon: 'pi-shop',
                            path: APP_ROUTES.ADMIN_RESTAURANTS,
                        },
                        {
                            label: 'Tables',
                            icon: 'pi-th-large',
                            path: APP_ROUTES.ADMIN_TABLES,
                        },
                        { label: 'Menu', icon: 'pi-book', path: APP_ROUTES.ADMIN_MENU },
                        { label: 'Users', icon: 'pi-users', path: APP_ROUTES.ADMIN_USERS },
                        {
                            label: 'Currencies',
                            icon: 'pi-euro',
                            path: APP_ROUTES.ADMIN_CURRENCIES,
                        },
                        { label: 'Logs', icon: 'pi-exclamation-triangle', path: APP_ROUTES.ADMIN_LOGS },
                    ],
                };
            case ROLES.MANAGER:
                return {
                    label: 'Manager',
                    subtitle: 'Operations',
                    icon: 'pi-briefcase',
                    items: [
                        { label: 'Dashboard', icon: 'pi-objects-column', path: APP_ROUTES.MANAGER },
                        {
                            label: 'Live orders',
                            icon: 'pi-bolt',
                            path: APP_ROUTES.MANAGER_LIVE_ORDERS,
                        },
                        { label: 'Orders', icon: 'pi-list', path: APP_ROUTES.MANAGER_ORDERS },
                        { label: 'Menu', icon: 'pi-book', path: APP_ROUTES.MANAGER_MENU },
                        {
                            label: 'Restaurants',
                            icon: 'pi-shop',
                            path: APP_ROUTES.MANAGER_RESTAURANTS,
                        },
                    ],
                };
            case ROLES.CASHIER:
                return {
                    label: 'Cashier',
                    subtitle: 'Front desk',
                    icon: 'pi-wallet',
                    items: [{ label: 'Cashier', icon: 'pi-dollar', path: APP_ROUTES.CASHIER }],
                };
            case ROLES.COOK:
                return {
                    label: 'Kitchen',
                    subtitle: 'Prep line',
                    icon: 'pi-stopwatch',
                    items: [{ label: 'Kitchen', icon: 'pi-stopwatch', path: APP_ROUTES.KITCHEN }],
                };
            case ROLES.WAITER:
                return {
                    label: 'Waiter',
                    subtitle: 'Floor',
                    icon: 'pi-bell',
                    items: [{ label: 'Waiter', icon: 'pi-bell', path: APP_ROUTES.WAITER }],
                };
            default:
                return { label: 'Guest', subtitle: '', icon: 'pi-user', items: [] };
        }
    });

    protected readonly initials = computed(() => {
        const user = this.auth.currentUser();
        if (!user) return '?';
        const source = user.fullName?.trim() || user.username || user.email || '';
        const parts = source.split(/\s+/).filter(Boolean);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });

    protected readonly fullName = computed(() => {
        const user = this.auth.currentUser();
        if (!user) return '';
        return user.fullName?.trim() || user.username || user.email || '';
    });

    protected readonly userEmail = computed(() => this.auth.currentUser()?.email ?? '');

    protected readonly employeeCode = computed(() => {
        const id = this.auth.currentUser()?.userId ?? 0;
        return id.toString().padStart(4, '0');
    });

    protected readonly sectionLabel = computed(() => {
        const url = this.currentUrl();
        const items = this.profile().items;
        const match = items.find((it) => url === it.path || url.startsWith(it.path + '/'));
        return match?.label ?? this.profile().label;
    });

    protected readonly timeLabel = computed(() => {
        const d = this.now();
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        const s = d.getSeconds().toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    });

    protected readonly profileOpen = signal(false);

    protected readonly joinedDate = computed(() => {
        const d = new Date();
        return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    });

    protected toggleProfile(): void {
        this.profileOpen.update((v) => !v);
    }

    protected closeProfile(): void {
        this.profileOpen.set(false);
    }

    ngOnInit(): void {
        const tick = () => this.now.set(new Date());
        const id = window.setInterval(tick, 1000);
        this.destroyRef.onDestroy(() => window.clearInterval(id));

        this.router.events
            .pipe(
                filter((e): e is NavigationEnd => e instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((e) => this.currentUrl.set(e.urlAfterRedirects));
    }

    protected logout(): void {
        this.auth.logout().subscribe({
            next: () => this.navigation.goToLogin(),
            error: () => this.navigation.goToLogin(),
        });
    }

    protected goToProfile(): void {
        this.profileOpen.set(false);
        this.navigation.goToProfile();
    }
}
