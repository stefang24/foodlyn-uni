import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRestaurantDTO } from '../models/createRestaurantDTO.model';
import { UpdateRestaurantDTO } from '../models/updateRestaurantDTO.model';
import { RestaurantDTO } from '../models/restaurantDTO.model';
import { Result } from '../models/result.model';
import { PagedResult, PagedRestaurantQuery, pagedQueryToParams } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class Restaurant {
    private apiUrl = `${environment.apiUrl}/restaurants`;
    private readonly http: HttpClient = inject(HttpClient);

    create(data: CreateRestaurantDTO): Observable<Result<RestaurantDTO>> {
        return this.http.post<Result<RestaurantDTO>>(this.apiUrl, data);
    }

    getAll(): Observable<Result<RestaurantDTO[]>> {
        return this.http.get<Result<RestaurantDTO[]>>(this.apiUrl);
    }

    getPaged(query: PagedRestaurantQuery): Observable<Result<PagedResult<RestaurantDTO>>> {
        const params = new HttpParams({ fromObject: pagedQueryToParams(query) });
        return this.http.get<Result<PagedResult<RestaurantDTO>>>(`${this.apiUrl}/paged`, { params });
    }

    getMine(): Observable<Result<RestaurantDTO[]>> {
        return this.http.get<Result<RestaurantDTO[]>>(`${this.apiUrl}/mine`);
    }

    getById(id: number): Observable<Result<RestaurantDTO>> {
        return this.http.get<Result<RestaurantDTO>>(`${this.apiUrl}/${id}`);
    }

    getPublic(): Observable<Result<RestaurantDTO[]>> {
        return this.http.get<Result<RestaurantDTO[]>>(`${this.apiUrl}/public`);
    }

    getBySlug(slug: string): Observable<Result<RestaurantDTO>> {
        return this.http.get<Result<RestaurantDTO>>(`${this.apiUrl}/public/slug/${slug}`);
    }

    update(id: number, data: UpdateRestaurantDTO): Observable<Result<RestaurantDTO>> {
        return this.http.put<Result<RestaurantDTO>>(`${this.apiUrl}/${id}`, data);
    }

    getOpeningHours(id: number): Observable<Result<OpeningHourDTO[]>> {
        return this.http.get<Result<OpeningHourDTO[]>>(`${this.apiUrl}/${id}/opening-hours`);
    }

    saveOpeningHours(id: number, data: UpdateOpeningHoursDTO): Observable<Result<OpeningHourDTO[]>> {
        return this.http.put<Result<OpeningHourDTO[]>>(`${this.apiUrl}/${id}/opening-hours`, data);
    }
}

export interface OpeningHourDTO {
    dayOfWeek: number;
    isOpen: boolean;
    openTime: string | null;
    closeTime: string | null;
}

export interface UpdateOpeningHoursDTO {
    days: OpeningHourDTO[];
}
