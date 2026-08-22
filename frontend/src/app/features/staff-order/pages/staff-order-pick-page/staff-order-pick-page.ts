import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { finalize, forkJoin } from 'rxjs';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { TableService, TableStatusDTO } from '../../../../shared/services/table.service';
import { StaffCartService } from '../../../../shared/services/staff-cart.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { NotifyService } from '../../../../shared/services/notify.service';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

const LOAD_KEY = 'staffOrderPick';

@Component({
    selector: 'app-staff-order-pick-page',
    imports: [FormsModule, ButtonModule, SelectModule],
    templateUrl: './staff-order-pick-page.html',
    styleUrl: './staff-order-pick-page.scss',
})
export class StaffOrderPickPage implements OnInit {
    private readonly restaurantService = inject(Restaurant);
    private readonly tableService = inject(TableService);
    private readonly staffCart = inject(StaffCartService);
    private readonly router = inject(Router);
    private readonly notify = inject(NotifyService);
    protected readonly loadingService = inject(LoadingService);
    protected readonly LOAD_KEY = LOAD_KEY;

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly selectedRestaurantId = signal<number | null>(null);
    protected readonly tables = signal<TableStatusDTO[]>([]);

    protected readonly restaurantOptions = computed(() =>
        this.restaurants().map((r) => ({ label: r.name, value: r.id })),
    );

    ngOnInit(): void {
        this.loadingService.start(LOAD_KEY);
        this.restaurantService
            .getMine()
            .pipe(finalize(() => this.loadingService.stop(LOAD_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.restaurants.set(res.value);
                        if (res.value.length === 1) {
                            this.selectRestaurant(res.value[0].id);
                        }
                    } else {
                        this.notify.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not load restaurants',
                            life: 3000,
                        });
                    }
                },
            });
    }

    protected selectRestaurant(id: number | null): void {
        this.selectedRestaurantId.set(id);
        this.tables.set([]);
        if (id == null) return;
        this.loadingService.start(LOAD_KEY);
        forkJoin({ tables: this.tableService.getStatus(id) })
            .pipe(finalize(() => this.loadingService.stop(LOAD_KEY)))
            .subscribe({
                next: ({ tables }) => {
                    if (tables.isSuccess) this.tables.set(tables.value);
                },
            });
    }

    protected canPick(t: TableStatusDTO): boolean {
        return t.status !== 'Cleaning' && t.status !== 'OutOfService';
    }

    protected pickTable(t: TableStatusDTO): void {
        if (!this.canPick(t)) return;
        const restaurantId = this.selectedRestaurantId();
        if (restaurantId == null) return;
        const restaurant = this.restaurants().find((r) => r.id === restaurantId);
        if (!restaurant) return;
        this.staffCart.setContext({
            restaurantId,
            restaurantName: restaurant.name,
            tableId: t.id,
            tableNumber: t.number,
            tableLabel: t.label,
        });
        this.router.navigate(['/staff-order/menu']);
    }

    protected statusBadgeClass(status: string): string {
        return `badge-${status?.toLowerCase() ?? 'unknown'}`;
    }
}
