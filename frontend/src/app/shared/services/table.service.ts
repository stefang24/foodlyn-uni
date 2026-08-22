import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    BulkCreateRestaurantTablesDTO,
    CreateRestaurantTableDTO,
    RestaurantTableDTO,
    TableQrResolveDTO,
    UpdateRestaurantTableDTO,
} from '../models/tableDTO.model';
import { Result } from '../models/result.model';

@Injectable({ providedIn: 'root' })
export class TableService {
    private apiUrl = `${environment.apiUrl}/tables`;
    private readonly http: HttpClient = inject(HttpClient);

    resolveQr(token: string): Observable<Result<TableQrResolveDTO>> {
        return this.http.get<Result<TableQrResolveDTO>>(`${this.apiUrl}/qr/${token}`);
    }

    getByRestaurant(restaurantId: number): Observable<Result<RestaurantTableDTO[]>> {
        return this.http.get<Result<RestaurantTableDTO[]>>(
            `${this.apiUrl}/restaurant/${restaurantId}`,
        );
    }

    getById(id: number): Observable<Result<RestaurantTableDTO>> {
        return this.http.get<Result<RestaurantTableDTO>>(`${this.apiUrl}/${id}`);
    }

    create(data: CreateRestaurantTableDTO): Observable<Result<RestaurantTableDTO>> {
        return this.http.post<Result<RestaurantTableDTO>>(this.apiUrl, data);
    }

    bulkCreate(data: BulkCreateRestaurantTablesDTO): Observable<Result<RestaurantTableDTO[]>> {
        return this.http.post<Result<RestaurantTableDTO[]>>(`${this.apiUrl}/bulk`, data);
    }

    update(id: number, data: UpdateRestaurantTableDTO): Observable<Result<RestaurantTableDTO>> {
        return this.http.put<Result<RestaurantTableDTO>>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: number): Observable<Result<string>> {
        return this.http.delete<Result<string>>(`${this.apiUrl}/${id}`);
    }

    rotateToken(id: number): Observable<Result<RestaurantTableDTO>> {
        return this.http.post<Result<RestaurantTableDTO>>(`${this.apiUrl}/${id}/rotate-token`, {});
    }

    callWaiter(tableId: number, message: string | null): Observable<Result<TableCallDTO>> {
        return this.http.post<Result<TableCallDTO>>(`${this.apiUrl}/${tableId}/call-waiter`, {
            message,
        });
    }

    getCalls(restaurantId: number): Observable<Result<TableCallDTO[]>> {
        return this.http.get<Result<TableCallDTO[]>>(`${this.apiUrl}/calls/${restaurantId}`);
    }

    acknowledgeCall(callId: number, restaurantId: number): Observable<Result<string>> {
        return this.http.post<Result<string>>(
            `${this.apiUrl}/calls/${callId}/acknowledge?restaurantId=${restaurantId}`,
            {},
        );
    }

    closeSession(tableId: number): Observable<Result<RestaurantTableDTO>> {
        return this.http.post<Result<RestaurantTableDTO>>(
            `${this.apiUrl}/${tableId}/close-session`,
            {},
        );
    }

    markCleaned(tableId: number): Observable<Result<RestaurantTableDTO>> {
        return this.http.post<Result<RestaurantTableDTO>>(
            `${this.apiUrl}/${tableId}/mark-cleaned`,
            {},
        );
    }

    finishEating(tableId: number): Observable<Result<RestaurantTableDTO>> {
        return this.http.post<Result<RestaurantTableDTO>>(
            `${this.apiUrl}/${tableId}/finish-eating`,
            {},
        );
    }

    getStatus(restaurantId: number): Observable<Result<TableStatusDTO[]>> {
        return this.http.get<Result<TableStatusDTO[]>>(`${this.apiUrl}/status/${restaurantId}`);
    }
}

export interface TableCallDTO {
    id: number;
    tableId: number;
    tableNumber: number;
    tableLabel: string | null;
    restaurantId: number;
    message: string | null;
    createdAt: string;
}

export interface TableStatusDTO {
    id: number;
    number: number;
    label: string | null;
    capacity: number;
    status: string;
    currentPartySize: number;
    isActive: boolean;
    activeOrders: number;
    latestOrderStatus: string | null;
    latestOrderId: number | null;
}
