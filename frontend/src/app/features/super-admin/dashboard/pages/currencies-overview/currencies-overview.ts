import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { HttpErrorResponse } from '@angular/common/http';
import { NotifyService } from '../../../../../shared/services/notify.service';
import {
    CurrencyDTO,
    ReferenceService,
} from '../../../../../shared/services/reference.service';

@Component({
    selector: 'app-currencies-overview',
    imports: [CommonModule, FormsModule, TableModule, InputTextModule, ButtonModule],
    templateUrl: './currencies-overview.html',
    styleUrl: './currencies-overview.scss',
})
export class CurrenciesOverview implements OnInit {
    private readonly referenceService = inject(ReferenceService);
    private readonly notify = inject(NotifyService);

    protected readonly currencies = signal<CurrencyDTO[]>([]);
    protected readonly editingCode = signal<string | null>(null);
    protected readonly editingRate = signal<number>(0);
    protected readonly saving = signal(false);

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        this.referenceService.getAllCurrencies().subscribe({
            next: (res) => {
                if (res.isSuccess) this.currencies.set(res.value);
            },
        });
    }

    protected startEdit(c: CurrencyDTO): void {
        this.editingCode.set(c.code);
        this.editingRate.set(c.rateToEur);
    }

    protected cancel(): void {
        this.editingCode.set(null);
    }

    protected save(c: CurrencyDTO): void {
        const rate = this.editingRate();
        if (!rate || rate <= 0) {
            this.notify.add({
                severity: 'error',
                summary: 'Invalid rate',
                detail: 'Rate must be positive',
                life: 3000,
            });
            return;
        }
        this.saving.set(true);
        this.referenceService.updateRate(c.code, rate).subscribe({
            next: (res) => {
                this.saving.set(false);
                if (res.isSuccess) {
                    this.currencies.update((list) =>
                        list.map((x) => (x.code === res.value.code ? res.value : x)),
                    );
                    this.editingCode.set(null);
                    this.notify.add({
                        severity: 'success',
                        summary: 'Rate updated',
                        detail: `${res.value.code} = ${res.value.rateToEur} per EUR`,
                        life: 2500,
                    });
                } else {
                    this.notify.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not update rate',
                        life: 3000,
                    });
                }
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                this.notify.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.error ?? 'Could not update rate',
                    life: 3000,
                });
            },
        });
    }
}
