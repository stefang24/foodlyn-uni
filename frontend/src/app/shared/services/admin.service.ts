import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { RegisterDTO } from '../models/registerDTO.model';
import { Observable } from 'rxjs';
import { Result } from '../models/result.model';

@Injectable({
    providedIn: 'root',
})
export class Admin {
    private apiUrl = `${environment.apiUrl}/admin`;
    private readonly http: HttpClient = inject(HttpClient);

    createAccount(data: RegisterDTO): Observable<Result<string>> {
        return this.http.post<Result<string>>(this.apiUrl + '/create-account', data);
    }
}
