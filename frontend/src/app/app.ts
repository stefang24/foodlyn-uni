import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActiveOrderBubble } from './shared/components/active-order-bubble/active-order-bubble';
import { Notifications } from './shared/components/notifications/notifications';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, ActiveOrderBubble, Notifications],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
}
