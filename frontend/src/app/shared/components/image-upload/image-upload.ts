import { Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FileUploadService } from '../../services/file-upload.service';
import { NotifyService } from '../../services/notify.service';

@Component({
    selector: 'app-image-upload',
    imports: [],
    templateUrl: './image-upload.html',
    styleUrl: './image-upload.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ImageUpload),
            multi: true,
        },
    ],
})
export class ImageUpload implements ControlValueAccessor {
    private readonly fileUpload = inject(FileUploadService);
    private readonly notify = inject(NotifyService);

    folder = input<string>('misc');
    label = input<string>('Image');
    aspect = input<'square' | 'wide'>('wide');

    protected readonly value = signal<string | null>(null);
    protected readonly uploading = signal(false);
    protected readonly disabled = signal(false);

    protected readonly previewUrl = computed(() => this.fileUpload.resolveUrl(this.value()));

    private onChange: (v: string | null) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: string | null): void {
        this.value.set(value ?? null);
    }

    registerOnChange(fn: (v: string | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    protected onPick(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;

        this.uploading.set(true);
        this.fileUpload.upload(file, this.folder()).subscribe({
            next: (res) => {
                this.uploading.set(false);
                if (res.isSuccess) {
                    this.value.set(res.value);
                    this.onChange(res.value);
                    this.onTouched();
                } else {
                    this.notify.add({
                        severity: 'error',
                        summary: 'Upload failed',
                        detail: res.error ?? 'Could not upload file',
                        life: 3000,
                    });
                }
            },
            error: (err: HttpErrorResponse) => {
                this.uploading.set(false);
                this.notify.add({
                    severity: 'error',
                    summary: 'Upload failed',
                    detail: err.error?.error ?? 'Could not upload file',
                    life: 3000,
                });
            },
        });
    }

    protected clear(): void {
        this.value.set(null);
        this.onChange(null);
        this.onTouched();
    }
}
