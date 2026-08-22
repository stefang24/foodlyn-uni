import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-server-error',
    imports: [RouterLink, ButtonModule],
    templateUrl: './server-error.html',
    styleUrl: './server-error.scss',
})
export class ServerError {}
