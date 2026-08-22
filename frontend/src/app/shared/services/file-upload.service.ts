import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '../models/result.model';

@Injectable({ providedIn: 'root' })
export class FileUploadService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/files`;

    upload(file: File, folder: string): Observable<Result<string>> {
        const formData = new FormData();
        formData.append('file', file);
        const params = new HttpParams().set('folder', folder);
        return this.http.post<Result<string>>(`${this.apiUrl}/upload`, formData, {
            params,
            withCredentials: true,
        });
    }

    resolveUrl(relativeOrAbsolute: string | null | undefined): string | null {
        if (!relativeOrAbsolute) return null;
        if (relativeOrAbsolute.startsWith('http://') || relativeOrAbsolute.startsWith('https://')) {
            return relativeOrAbsolute;
        }
        if (relativeOrAbsolute.startsWith('/')) {
            const base = environment.apiUrl.replace(/\/api\/?$/, '');
            return base + relativeOrAbsolute;
        }
        return relativeOrAbsolute;
    }
}
