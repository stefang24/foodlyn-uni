import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '../models/result.model';
import { AdvanceLobbyDTO, TableLobbyDTO } from '../models/tableLobbyDTO.model';

@Injectable({ providedIn: 'root' })
export class TableLobbyService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/sessions/lobby`;

    get(tableId: number): Observable<Result<TableLobbyDTO | null>> {
        return this.http.get<Result<TableLobbyDTO | null>>(`${this.apiUrl}/${tableId}`);
    }

    advance(tableId: number, dto: AdvanceLobbyDTO): Observable<Result<TableLobbyDTO>> {
        return this.http.post<Result<TableLobbyDTO>>(`${this.apiUrl}/${tableId}/advance`, dto);
    }
}
