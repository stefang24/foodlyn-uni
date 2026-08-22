import { Component, inject } from '@angular/core';
import { NotifyService, NotifySeverity } from '../../services/notify.service';

@Component({
    selector: 'app-notifications',
    imports: [],
    templateUrl: './notifications.html',
    styleUrl: './notifications.scss',
})
export class Notifications {
    private readonly notify = inject(NotifyService);
    protected readonly items = this.notify.notifications;

    protected dismiss(id: number): void {
        this.notify.dismiss(id);
    }

    protected iconFor(severity: NotifySeverity): string {
        switch (severity) {
            case 'success': return 'pi pi-check-circle';
            case 'error':   return 'pi pi-times-circle';
            case 'warn':    return 'pi pi-exclamation-triangle';
            default:        return 'pi pi-info-circle';
        }
    }
}
