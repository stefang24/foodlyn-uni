import { Component, inject } from '@angular/core';
import { NotifyService } from '../../../../../shared/services/notify.service';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { finalize } from 'rxjs';
import { AuthService, CurrentUser, EMAIL_NOT_VERIFIED } from '../../../../../shared/services/auth.service';
import { Result } from '../../../../../shared/models/result.model';
import { NavigationService } from '../../../../../core/services/navigation.service';
import { emailOrUsernameValidator } from '../../../../../core/validators/auth-validators';
import { LoadingService } from '../../../../../core/services/loading.service';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginDTO } from '../../models/loginDTO.model';

const LOGIN_LOADING_KEY = 'login';

@Component({
    selector: 'app-login',
    imports: [
        MessageModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        ReactiveFormsModule,
        RouterLink,
    ],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class Login {
    private fb = inject(FormBuilder);
    private messageService = inject(NotifyService);
    private readonly authService: AuthService = inject(AuthService);
    private readonly navigation: NavigationService = inject(NavigationService);
    private readonly router: Router = inject(Router);
    protected readonly loadingService: LoadingService = inject(LoadingService);
    protected readonly LOGIN_KEY = LOGIN_LOADING_KEY;

    loginForm: FormGroup = this.fb.group({
        identifier: ['', [Validators.required, emailOrUsernameValidator]],
        password: ['', [Validators.required, Validators.minLength(6)]],
    });

    onSubmit() {
        if (this.loginForm.invalid) return;

        const { identifier, password } = this.loginForm.value;

        this.loadingService.start(LOGIN_LOADING_KEY);

        const data: LoginDTO = {
            email: identifier,
            username: identifier,
            password: password
        }

        this.authService.login(data)
            .pipe(finalize(() => this.loadingService.stop(LOGIN_LOADING_KEY)))
            .subscribe({
                next: (cu: Result<CurrentUser>) => {
                    if (cu.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: `Logging in as ${identifier}`,
                            life: 3000,
                        });
                        this.navigation.goToDashboard();
                    } else {
                    }
                },
                error: (err : HttpErrorResponse) => {
                        const apiError: string = err.error?.error ?? '';
                        if (apiError.startsWith(EMAIL_NOT_VERIFIED)) {
                            const parts = apiError.split('|');
                            const email = parts[1] ?? (identifier.includes('@') ? identifier : '');
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Email not verified',
                                detail: 'Please verify your email to continue',
                                life: 3500,
                            });
                            this.router.navigate(['/verify-email'], { state: { email } });
                            return;
                        }
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: apiError || 'Could not log in',
                            life: 3000,
                        });
                }
            });
    }

    isInvalid(controlName: string): boolean {
        const control = this.loginForm.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    getErrorMessage(controlName: string): string {
        const control = this.loginForm.get(controlName);
        if (!control || !control.errors) return '';

        if (control.errors['required']) return 'This field is required';
        if (control.errors['minlength']) {
            return `Minimum ${control.errors['minlength'].requiredLength} characters`;
        }
        if (control.errors['emailOrUsername']) return 'Enter a valid email or username';

        return '';
    }

    goToHome(): void {
        this.navigation.goToHome();
    }
}
