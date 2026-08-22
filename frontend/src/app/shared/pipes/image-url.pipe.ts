import { inject, Pipe, PipeTransform } from '@angular/core';
import { FileUploadService } from '../services/file-upload.service';

@Pipe({
    name: 'imageUrl',
    pure: true,
})
export class ImageUrlPipe implements PipeTransform {
    private readonly fileUpload = inject(FileUploadService);

    transform(value: string | null | undefined): string | null {
        return this.fileUpload.resolveUrl(value);
    }
}
