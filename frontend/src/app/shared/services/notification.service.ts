import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '../models/result.model';
import { NotificationDTO, PagedNotificationsDTO } from '../models/notificationDTO.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/notifications`;

    getPaged(page: number, pageSize = 10): Observable<Result<PagedNotificationsDTO>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());
        return this.http.get<Result<PagedNotificationsDTO>>(this.apiUrl, { params });
    }

    getUnreadCount(): Observable<Result<number>> {
        return this.http.get<Result<number>>(`${this.apiUrl}/unread-count`);
    }

    markRead(id: number): Observable<Result<NotificationDTO>> {
        return this.http.post<Result<NotificationDTO>>(`${this.apiUrl}/${id}/read`, {});
    }

    markAllRead(): Observable<Result<number>> {
        return this.http.post<Result<number>>(`${this.apiUrl}/read-all`, {});
    }
}
