import { HttpErrorResponse } from '@angular/common/http';
import { NotifyService } from '../../../../../shared/services/notify.service';
import { Component, inject } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterCustomerDTO } from '../../../../../shared/services/auth.service';
import { LoadingService } from '../../../../../core/services/loading.service';
import { NavigationService } from '../../../../../core/services/navigation.service';
import {
    emailValidators,
    nameValidators,
    passwordMatchValidator,
    passwordValidators,
    usernameValidators,
} from '../../../../../core/validators/auth-validators';

const REGISTER_KEY = 'register';

@Component({
    selector: 'app-register',
    imports: [
        ReactiveFormsModule,
        RouterLink,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        MessageModule,
    ],
    templateUrl: './register.html',
    styleUrl: './register.scss',
})
export class Register {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(NotifyService);
    private readonly navigation = inject(NavigationService);
    private readonly router = inject(Router);
    protected readonly loadingService = inject(LoadingService);
    protected readonly REGISTER_KEY = REGISTER_KEY;

    registerForm: FormGroup = this.fb.group(
        {
            firstName: ['', nameValidators],
            lastName: ['', nameValidators],
            username: ['', usernameValidators],
            email: ['', emailValidators],
            password: ['', passwordValidators],
            confirmPassword: ['', [Validators.required]],
            acceptTerms: [false, Validators.requiredTrue],
        },
        { validators: passwordMatchValidator },
    );

    onSubmit(): void {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        const v = this.registerForm.value;
        const data: RegisterCustomerDTO = {
            firstName: v.firstName?.trim() || null,
            lastName: v.lastName?.trim() || null,
            email: v.email.trim(),
            username: v.username.trim(),
            password: v.password,
            confirmPassword: v.confirmPassword,
        };

        this.loadingService.start(REGISTER_KEY);
        this.authService
            .registerCustomer(data)
            .pipe(finalize(() => this.loadingService.stop(REGISTER_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Check your inbox',
                            detail: `We sent a 6-digit code to ${res.value.email}`,
                            life: 3000,
                        });
                        this.router.navigate(['/verify-email'], {
                            state: { email: res.value.email },
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not create account',
                            life: 3000,
                        });
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not create account',
                        life: 3000,
                    });
                },
            });
    }

    isInvalid(controlName: string): boolean {
        const control = this.registerForm.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    showMismatch(): boolean {
        const confirm = this.registerForm.get('confirmPassword');
        return !!(
            this.registerForm.hasError('passwordsMismatch') &&
            confirm &&
            (confirm.dirty || confirm.touched)
        );
    }

    getErrorMessage(controlName: string): string {
        const control = this.registerForm.get(controlName);
        if (!control || !control.errors) return '';
        if (control.errors['required']) return 'This field is required';
        if (control.errors['email']) return 'Enter a valid email';
        if (control.errors['minlength'])
            return `Minimum ${control.errors['minlength'].requiredLength} characters`;
        if (control.errors['maxlength'])
            return `Maximum ${control.errors['maxlength'].requiredLength} characters`;
        if (control.errors['pattern'] && controlName === 'username')
            return 'Letters, numbers and underscores only';
        return 'Invalid value';
    }

    goToLogin(): void {
        this.navigation.goToLogin();
    }

    goHome(): void {
        this.navigation.goToHome();
    }

    private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
        const password = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        if (!password || !confirm) return null;
        return password === confirm ? null : { passwordsMismatch: true };
    }
}
