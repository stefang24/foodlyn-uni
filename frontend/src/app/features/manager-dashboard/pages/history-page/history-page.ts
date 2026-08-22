import { CurrencyPipe, DatePipe } from '@angular/common';
import { NotifyService } from '../../../../shared/services/notify.service';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { OrderService } from '../../../../shared/services/order.service';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { OrderDTO, OrderStatus } from '../../../../shared/models/orderDTO.model';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';

const HISTORY_KEY = 'mgrHistory';

@Component({
    selector: 'app-history-page',
    imports: [FormsModule, SelectModule, CurrencyPipe, DatePipe],
    templateUrl: './history-page.html',
    styleUrl: './history-page.scss',
})
export class HistoryPage implements OnInit {
    private readonly orderService = inject(OrderService);
    private readonly restaurantService = inject(Restaurant);
    private readonly messageService = inject(NotifyService);
    protected readonly loadingService = inject(LoadingService);

    protected readonly HISTORY_KEY = HISTORY_KEY;

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly restaurantOptions = computed(() =>
        this.restaurants().map((r) => ({ label: r.name, value: r.id })),
    );
    protected readonly selectedRestaurantId = signal<number | null>(null);
    protected readonly history = signal<OrderDTO[]>([]);

    ngOnInit(): void {
        this.restaurantService.getMine().subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.restaurants.set(res.value);
                    if (res.value.length > 0 && this.selectedRestaurantId() === null) {
                        this.selectedRestaurantId.set(res.value[0].id);
                        this.loadHistory(res.value[0].id);
                    }
                }
            },
        });
    }

    protected onRestaurantChange(id: number | null): void {
        this.selectedRestaurantId.set(id);
        this.history.set([]);
        if (id != null) this.loadHistory(id);
    }

    protected statusClass(s: OrderStatus): string {
        return 's-' + s.toLowerCase();
    }

    private loadHistory(restaurantId: number): void {
        this.loadingService.start(HISTORY_KEY);
        this.orderService
            .getHistory(restaurantId, 100)
            .pipe(finalize(() => this.loadingService.stop(HISTORY_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.history.set(res.value);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not load history',
                            life: 3000,
                        });
                    }
                },
            });
    }
}
