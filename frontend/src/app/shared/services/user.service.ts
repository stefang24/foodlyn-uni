import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDTO } from '../models/userDTO.model';
import { UpdateUserDTO } from '../models/updateUserDTO.model';
import { Result } from '../models/result.model';
import { PagedResult, PagedUserQuery, pagedQueryToParams } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class User {
    private apiUrl = `${environment.apiUrl}/users`;
    private readonly http: HttpClient = inject(HttpClient);

    getAll(): Observable<Result<UserDTO[]>> {
        return this.http.get<Result<UserDTO[]>>(this.apiUrl);
    }

    getPaged(query: PagedUserQuery): Observable<Result<PagedResult<UserDTO>>> {
        const params = new HttpParams({ fromObject: pagedQueryToParams(query) });
        return this.http.get<Result<PagedResult<UserDTO>>>(`${this.apiUrl}/paged`, { params });
    }

    getById(id: number): Observable<Result<UserDTO>> {
        return this.http.get<Result<UserDTO>>(`${this.apiUrl}/${id}`);
    }

    update(id: number, data: UpdateUserDTO): Observable<Result<UserDTO>> {
        return this.http.put<Result<UserDTO>>(`${this.apiUrl}/${id}`, data);
    }

    getMyProfile(): Observable<Result<UserDTO>> {
        return this.http.get<Result<UserDTO>>(`${this.apiUrl}/me/profile`);
    }

    updateMyProfile(data: UpdateMyProfileDTO): Observable<Result<UserDTO>> {
        return this.http.put<Result<UserDTO>>(`${this.apiUrl}/me/profile`, data);
    }

    changePassword(data: ChangePasswordDTO): Observable<Result<string>> {
        return this.http.post<Result<string>>(`${this.apiUrl}/me/change-password`, data);
    }
}

export interface UpdateMyProfileDTO {
    firstName: string | null;
    lastName: string | null;
    email: string;
    username: string;
    profilePictureUrl: string | null;
}

export interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
