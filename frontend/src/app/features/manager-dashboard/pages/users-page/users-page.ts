import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NotifyService } from '../../../../shared/services/notify.service';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Manager } from '../../../../shared/services/manager.service';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { UserDTO } from '../../../../shared/models/userDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

@Component({
    selector: 'app-manager-users-page',
    imports: [DatePipe, TableModule],
    templateUrl: './users-page.html',
    styleUrl: './users-page.scss',
})
export class UsersPage implements OnInit {
    private readonly managerService: Manager = inject(Manager);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    protected readonly messageService: NotifyService = inject(NotifyService);

    protected readonly users = signal<UserDTO[]>([]);
    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly loading = signal(false);

    protected readonly totalUsers = computed(() => this.users().length);
    protected readonly activeUsers = computed(
        () => this.users().filter((u) => u.isActive).length,
    );
    protected readonly byRole = computed(() => {
        const map: Record<string, number> = {};
        for (const u of this.users()) {
            map[u.role] = (map[u.role] ?? 0) + 1;
        }
        return map;
    });

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.managerService
            .getUsers()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) this.users.set(res.value);
                    else
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not load users',
                            life: 3000,
                        });
                },
                error: () =>
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Could not load users',
                        life: 3000,
                    }),
            });

        this.restaurantService.getMine().subscribe({
            next: (res) => {
                if (res.isSuccess) this.restaurants.set(res.value);
            },
        });
    }

    restaurantName(id: number | null): string {
        if (id == null) return '-';
        return this.restaurants().find((r) => r.id === id)?.name ?? `#${id}`;
    }
}
