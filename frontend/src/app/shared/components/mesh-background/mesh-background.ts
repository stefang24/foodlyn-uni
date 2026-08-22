import { Component, ElementRef, HostListener, inject } from '@angular/core';

@Component({
    selector: 'app-mesh-background',
    imports: [],
    template: '',
    styleUrl: './mesh-background.scss',
})
export class MeshBackground {
    private readonly host = inject(ElementRef<HTMLElement>);

    @HostListener('document:mousemove', ['$event'])
    onMove(event: MouseEvent): void {
        const el = this.host.nativeElement as HTMLElement;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--mx', `${Math.max(-20, Math.min(120, x))}%`);
        el.style.setProperty('--my', `${Math.max(-20, Math.min(120, y))}%`);
    }
}
