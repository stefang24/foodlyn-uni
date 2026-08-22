import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterDTO } from '../models/registerDTO.model';
import { UserDTO } from '../models/userDTO.model';
import { UpdateUserDTO } from '../models/updateUserDTO.model';
import { Result } from '../models/result.model';
import { PagedResult, PagedUserQuery, pagedQueryToParams } from '../models/paged.model';

export interface AdminResetPasswordDTO {
    newPassword: string;
    confirmPassword: string;
}

@Injectable({
    providedIn: 'root',
})
export class Manager {
    private apiUrl = `${environment.apiUrl}/manager`;
    private readonly http: HttpClient = inject(HttpClient);

    createAccount(data: RegisterDTO): Observable<Result<string>> {
        return this.http.post<Result<string>>(this.apiUrl + '/create-account', data);
    }

    getUsers(): Observable<Result<UserDTO[]>> {
        return this.http.get<Result<UserDTO[]>>(`${this.apiUrl}/users`);
    }

    getUsersPaged(query: PagedUserQuery): Observable<Result<PagedResult<UserDTO>>> {
        const params = new HttpParams({ fromObject: pagedQueryToParams(query) });
        return this.http.get<Result<PagedResult<UserDTO>>>(`${this.apiUrl}/users/paged`, { params });
    }

    updateUser(id: number, data: UpdateUserDTO): Observable<Result<UserDTO>> {
        return this.http.put<Result<UserDTO>>(`${this.apiUrl}/users/${id}`, data);
    }

    resetUserPassword(id: number, data: AdminResetPasswordDTO): Observable<Result<string>> {
        return this.http.post<Result<string>>(`${this.apiUrl}/users/${id}/reset-password`, data);
    }
}
