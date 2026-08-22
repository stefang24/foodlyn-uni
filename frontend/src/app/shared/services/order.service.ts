import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CreateOrderDTO,
    OrderDTO,
    RejectOrderDTO,
    StartPreparingDTO,
} from '../models/orderDTO.model';
import { Result } from '../models/result.model';
import { PagedQuery, PagedResult, pagedQueryToParams } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
    private apiUrl = `${environment.apiUrl}/orders`;
    private readonly http: HttpClient = inject(HttpClient);

    create(data: CreateOrderDTO): Observable<Result<OrderDTO>> {
        return this.http.post<Result<OrderDTO>>(this.apiUrl, data);
    }

    getMine(): Observable<Result<OrderDTO[]>> {
        return this.http.get<Result<OrderDTO[]>>(`${this.apiUrl}/mine`);
    }

    getActiveAtTable(tableId: number): Observable<Result<OrderDTO[]>> {
        return this.http.get<Result<OrderDTO[]>>(`${this.apiUrl}/active-at-table/${tableId}`);
    }

    getAnalytics(query: AnalyticsQuery): Observable<Result<OrderAnalyticsDTO>> {
        let params = new HttpParams().set('range', query.range);
        if (query.restaurantId != null) params = params.set('restaurantId', String(query.restaurantId));
        if (query.year != null) params = params.set('year', String(query.year));
        if (query.month != null) params = params.set('month', String(query.month));
        return this.http.get<Result<OrderAnalyticsDTO>>(`${this.apiUrl}/analytics`, { params });
    }

    getById(id: number): Observable<Result<OrderDTO>> {
        return this.http.get<Result<OrderDTO>>(`${this.apiUrl}/${id}`);
    }

    getReturnLink(id: number): Observable<Result<OrderReturnLinkDTO>> {
        return this.http.get<Result<OrderReturnLinkDTO>>(`${this.apiUrl}/${id}/return-link`);
    }

    getCashierQueue(restaurantId: number): Observable<Result<OrderDTO[]>> {
        return this.http.get<Result<OrderDTO[]>>(`${this.apiUrl}/cashier/${restaurantId}`);
    }

    getKitchenQueue(restaurantId: number): Observable<Result<OrderDTO[]>> {
        return this.http.get<Result<OrderDTO[]>>(`${this.apiUrl}/kitchen/${restaurantId}`);
    }

    getWaiterQueue(restaurantId: number): Observable<Result<OrderDTO[]>> {
        return this.http.get<Result<OrderDTO[]>>(`${this.apiUrl}/waiter/${restaurantId}`);
    }

    getAwaitingPayment(restaurantId: number): Observable<Result<OrderDTO[]>> {
        return this.http.get<Result<OrderDTO[]>>(
            `${this.apiUrl}/awaiting-payment/${restaurantId}`,
        );
    }

    getHistory(restaurantId: number, take = 100): Observable<Result<OrderDTO[]>> {
        return this.http.get<Result<OrderDTO[]>>(
            `${this.apiUrl}/history/${restaurantId}?take=${take}`,
        );
    }

    getPagedHistory(restaurantId: number, query: PagedOrderQuery): Observable<Result<PagedResult<OrderDTO>>> {
        const params = new HttpParams({ fromObject: pagedQueryToParams(query) });
        return this.http.get<Result<PagedResult<OrderDTO>>>(
            `${this.apiUrl}/history/${restaurantId}/paged`,
            { params },
        );
    }

    getPagedHistoryAll(query: PagedOrderQuery): Observable<Result<PagedResult<OrderDTO>>> {
        const params = new HttpParams({ fromObject: pagedQueryToParams(query) });
        return this.http.get<Result<PagedResult<OrderDTO>>>(
            `${this.apiUrl}/history-all/paged`,
            { params },
        );
    }

    getLive(restaurantId: number): Observable<Result<OrderDTO[]>> {
        return this.http.get<Result<OrderDTO[]>>(`${this.apiUrl}/live/${restaurantId}`);
    }

    getStatusDisplay(restaurantId: number): Observable<Result<OrderDTO[]>> {
        return this.http.get<Result<OrderDTO[]>>(`${this.apiUrl}/status-display/${restaurantId}`);
    }

    getLiveAll(): Observable<Result<OrderDTO[]>> {
        return this.http.get<Result<OrderDTO[]>>(`${this.apiUrl}/live-all`);
    }

    getTopRestaurants(): Observable<Result<TopRestaurantStatDTO[]>> {
        return this.http.get<Result<TopRestaurantStatDTO[]>>(`${this.apiUrl}/top-restaurants`);
    }

    approve(id: number): Observable<Result<OrderDTO>> {
        return this.http.post<Result<OrderDTO>>(`${this.apiUrl}/${id}/approve`, {});
    }

    reject(id: number, data: RejectOrderDTO): Observable<Result<OrderDTO>> {
        return this.http.post<Result<OrderDTO>>(`${this.apiUrl}/${id}/reject`, data);
    }

    startPreparing(id: number, data: StartPreparingDTO): Observable<Result<OrderDTO>> {
        return this.http.post<Result<OrderDTO>>(`${this.apiUrl}/${id}/start`, data);
    }

    markReady(id: number): Observable<Result<OrderDTO>> {
        return this.http.post<Result<OrderDTO>>(`${this.apiUrl}/${id}/ready`, {});
    }

    markServed(id: number): Observable<Result<OrderDTO>> {
        return this.http.post<Result<OrderDTO>>(`${this.apiUrl}/${id}/serve`, {});
    }

    markPaid(id: number): Observable<Result<OrderDTO>> {
        return this.http.post<Result<OrderDTO>>(`${this.apiUrl}/${id}/mark-paid`, {});
    }

    cancel(id: number): Observable<Result<OrderDTO>> {
        return this.http.post<Result<OrderDTO>>(`${this.apiUrl}/${id}/cancel`, {});
    }
}

export interface OrderReturnLinkDTO {
    qrToken: string;
    tableId: number;
    tableNumber: number;
}

export interface PagedOrderQuery extends PagedQuery {
    status?: string | null;
    paymentMethod?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
}

export type AnalyticsRange = 'Week' | 'Month' | 'Year' | 'Lifetime';

export interface AnalyticsQuery {
    restaurantId?: number | null;
    range: AnalyticsRange;
    year?: number | null;
    month?: number | null;
}

export interface OrderAnalyticsBarDTO {
    label: string;
    revenue: number;
    orderCount: number;
    percent: number;
}

export interface OrderAnalyticsMostSoldDTO {
    name: string;
    count: number;
}

export interface TopRestaurantStatDTO {
    restaurantId: number;
    orderCount: number;
    revenue: number;
    currency: string | null;
}

export interface OrderAnalyticsDTO {
    range: string;
    fromDate: string;
    toDate: string;
    totalCompleted: number;
    totalRevenue: number;
    avgOrderValue: number;
    bars: OrderAnalyticsBarDTO[];
    mostSold: OrderAnalyticsMostSoldDTO[];
}
