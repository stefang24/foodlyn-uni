import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CreateMenuCategoryDTO,
    CreateMenuDTO,
    CreateMenuItemDTO,
    CreateMenuItemModifierDTO,
    CreateMenuItemModifierGroupDTO,
    MenuCategoryDTO,
    MenuDTO,
    MenuItemDTO,
    MenuItemModifierDTO,
    MenuItemModifierGroupDTO,
    UpdateMenuCategoryDTO,
    UpdateMenuDTO,
    UpdateMenuItemDTO,
    UpdateMenuItemModifierDTO,
    UpdateMenuItemModifierGroupDTO,
} from '../models/menuDTO.model';
import { Result } from '../models/result.model';

@Injectable({ providedIn: 'root' })
export class Menu {
    private apiUrl = `${environment.apiUrl}/menus`;
    private readonly http: HttpClient = inject(HttpClient);

    getByRestaurant(restaurantId: number): Observable<Result<MenuDTO[]>> {
        return this.http.get<Result<MenuDTO[]>>(`${this.apiUrl}/restaurant/${restaurantId}`);
    }

    getForOrder(restaurantId: number): Observable<Result<MenuDTO[]>> {
        return this.http.get<Result<MenuDTO[]>>(`${this.apiUrl}/for-order/${restaurantId}`);
    }

    getPublicBySlug(slug: string): Observable<Result<MenuDTO[]>> {
        return this.http.get<Result<MenuDTO[]>>(`${this.apiUrl}/public/slug/${slug}`);
    }

    getById(id: number): Observable<Result<MenuDTO>> {
        return this.http.get<Result<MenuDTO>>(`${this.apiUrl}/${id}`);
    }

    create(data: CreateMenuDTO): Observable<Result<MenuDTO>> {
        return this.http.post<Result<MenuDTO>>(this.apiUrl, data);
    }

    update(id: number, data: UpdateMenuDTO): Observable<Result<MenuDTO>> {
        return this.http.put<Result<MenuDTO>>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: number): Observable<Result<string>> {
        return this.http.delete<Result<string>>(`${this.apiUrl}/${id}`);
    }

    createCategory(data: CreateMenuCategoryDTO): Observable<Result<MenuCategoryDTO>> {
        return this.http.post<Result<MenuCategoryDTO>>(`${this.apiUrl}/categories`, data);
    }

    updateCategory(id: number, data: UpdateMenuCategoryDTO): Observable<Result<MenuCategoryDTO>> {
        return this.http.put<Result<MenuCategoryDTO>>(`${this.apiUrl}/categories/${id}`, data);
    }

    deleteCategory(id: number): Observable<Result<string>> {
        return this.http.delete<Result<string>>(`${this.apiUrl}/categories/${id}`);
    }

    createItem(data: CreateMenuItemDTO): Observable<Result<MenuItemDTO>> {
        return this.http.post<Result<MenuItemDTO>>(`${this.apiUrl}/items`, data);
    }

    updateItem(id: number, data: UpdateMenuItemDTO): Observable<Result<MenuItemDTO>> {
        return this.http.put<Result<MenuItemDTO>>(`${this.apiUrl}/items/${id}`, data);
    }

    deleteItem(id: number): Observable<Result<string>> {
        return this.http.delete<Result<string>>(`${this.apiUrl}/items/${id}`);
    }

    createModifierGroup(
        data: CreateMenuItemModifierGroupDTO,
    ): Observable<Result<MenuItemModifierGroupDTO>> {
        return this.http.post<Result<MenuItemModifierGroupDTO>>(
            `${this.apiUrl}/modifier-groups`,
            data,
        );
    }

    updateModifierGroup(
        id: number,
        data: UpdateMenuItemModifierGroupDTO,
    ): Observable<Result<MenuItemModifierGroupDTO>> {
        return this.http.put<Result<MenuItemModifierGroupDTO>>(
            `${this.apiUrl}/modifier-groups/${id}`,
            data,
        );
    }

    deleteModifierGroup(id: number): Observable<Result<string>> {
        return this.http.delete<Result<string>>(`${this.apiUrl}/modifier-groups/${id}`);
    }

    createModifier(data: CreateMenuItemModifierDTO): Observable<Result<MenuItemModifierDTO>> {
        return this.http.post<Result<MenuItemModifierDTO>>(`${this.apiUrl}/modifiers`, data);
    }

    updateModifier(
        id: number,
        data: UpdateMenuItemModifierDTO,
    ): Observable<Result<MenuItemModifierDTO>> {
        return this.http.put<Result<MenuItemModifierDTO>>(`${this.apiUrl}/modifiers/${id}`, data);
    }

    deleteModifier(id: number): Observable<Result<string>> {
        return this.http.delete<Result<string>>(`${this.apiUrl}/modifiers/${id}`);
    }
}
