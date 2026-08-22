import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SystemLogDTO } from '../models/systemLogDTO.model';
import { Result } from '../models/result.model';
import { PagedQuery, PagedResult, pagedQueryToParams } from '../models/paged.model';

export interface SystemLogQuery extends PagedQuery {
    level?: string | null;
    statusCode?: number | null;
    fromDate?: string | null;
    toDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SystemLogService {
    private apiUrl = `${environment.apiUrl}/admin/logs`;
    private readonly http: HttpClient = inject(HttpClient);

    getPaged(query: SystemLogQuery): Observable<Result<PagedResult<SystemLogDTO>>> {
        const params = new HttpParams({ fromObject: pagedQueryToParams(query) });
        return this.http.get<Result<PagedResult<SystemLogDTO>>>(`${this.apiUrl}/paged`, { params });
    }

    getById(id: number): Observable<Result<SystemLogDTO>> {
        return this.http.get<Result<SystemLogDTO>>(`${this.apiUrl}/${id}`);
    }
}
