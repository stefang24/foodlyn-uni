import { Component, inject, signal } from '@angular/core';
import { NotifyService } from '../../../../../shared/services/notify.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
    SystemLogQuery,
    SystemLogService,
} from '../../../../../shared/services/system-log.service';
import { SystemLogDTO } from '../../../../../shared/models/systemLogDTO.model';

@Component({
    selector: 'app-admin-logs',
    imports: [
        DatePipe,
        FormsModule,
        TableModule,
        DialogModule,
        InputTextModule,
        SelectModule,
    ],

    templateUrl: './logs.html',
    styleUrl: './logs.scss',
})
export class AdminLogs {
    private readonly logService = inject(SystemLogService);
    private readonly messageService = inject(NotifyService);

    protected readonly logs = signal<SystemLogDTO[]>([]);
    protected readonly totalCount = signal(0);
    protected readonly loading = signal(false);

    protected readonly searchText = signal('');
    protected readonly levelFilter = signal<string | null>(null);

    protected readonly detailOpen = signal(false);
    protected readonly detailLog = signal<SystemLogDTO | null>(null);

    protected readonly levelOptions = [
        { label: 'Error', value: 'Error' },
        { label: 'Warning', value: 'Warning' },
        { label: 'Info', value: 'Info' },
    ];

    private currentLazy: TableLazyLoadEvent | null = null;
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    onLazyLoad(event: TableLazyLoadEvent): void {
        this.currentLazy = event;
        this.fetchPage();
    }

    private fetchPage(): void {
        const event = this.currentLazy ?? { first: 0, rows: 10 };
        const first = event.first ?? 0;
        const rows = event.rows ?? 10;
        const sortField = (event.sortField as string | undefined) ?? null;
        const sortOrder = event.sortOrder ?? -1;

        const query: SystemLogQuery = {
            page: Math.floor(first / rows) + 1,
            pageSize: rows,
            search: this.searchText() || null,
            sortBy: sortField || 'createdAt',
            sortDir: sortField ? (sortOrder >= 0 ? 'asc' : 'desc') : 'desc',
            level: this.levelFilter(),
        };

        this.loading.set(true);
        this.logService
            .getPaged(query)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.logs.set(res.value.items);
                        this.totalCount.set(res.value.totalCount);
                    }
                },
            });
    }

    onSearchChange(value: string): void {
        this.searchText.set(value);
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.reload(), 300);
    }

    setLevelFilter(value: string | null): void {
        this.levelFilter.set(value);
        this.reload();
    }

    private reload(): void {
        if (this.currentLazy) this.currentLazy = { ...this.currentLazy, first: 0 };
        this.fetchPage();
    }

    openDetail(log: SystemLogDTO): void {
        this.detailLog.set(log);
        this.detailOpen.set(true);

        this.logService.getById(log.id).subscribe({
            next: (res) => {
                if (res.isSuccess) this.detailLog.set(res.value);
            },
        });
    }

    closeDetail(): void {
        this.detailOpen.set(false);
        this.detailLog.set(null);
    }

    copyStack(): void {
        const log = this.detailLog();
        if (!log?.stackTrace) return;
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(log.stackTrace).then(() => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'toast.stackCopied',
                    life: 1800,
                });
            });
        }
    }

    statusClass(status: number | null): string {
        if (status == null) return 'st-unknown';
        if (status >= 500) return 'st-500';
        if (status >= 400) return 'st-400';
        if (status >= 300) return 'st-300';
        if (status >= 200) return 'st-200';
        return 'st-other';
    }

    levelClass(level: string): string {
        return 'lvl-' + (level || '').toLowerCase();
    }
}
