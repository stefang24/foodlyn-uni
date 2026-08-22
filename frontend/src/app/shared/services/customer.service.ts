import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RestaurantDTO } from '../models/restaurantDTO.model';
import { MenuDTO } from '../models/menuDTO.model';
import { Result } from '../models/result.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
    private apiUrl = `${environment.apiUrl}/customer`;
    private readonly http: HttpClient = inject(HttpClient);

    getRestaurant(restaurantId: number): Observable<Result<RestaurantDTO>> {
        return this.http.get<Result<RestaurantDTO>>(`${this.apiUrl}/restaurant/${restaurantId}`);
    }

    getMenus(restaurantId: number): Observable<Result<MenuDTO[]>> {
        return this.http.get<Result<MenuDTO[]>>(`${this.apiUrl}/restaurant/${restaurantId}/menus`);
    }
}
