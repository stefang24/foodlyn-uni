import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { AuthService, VerifyEmailDTO } from '../../../../../shared/services/auth.service';
import { LoadingService } from '../../../../../core/services/loading.service';
import { NotifyService } from '../../../../../shared/services/notify.service';
import { NavigationService } from '../../../../../core/services/navigation.service';

const VERIFY_KEY = 'verifyEmail';
const RESEND_KEY = 'resendVerification';
const RESEND_COOLDOWN_SECONDS = 60;
const STORAGE_KEY = 'foodlyn_pending_verification_email';

@Component({
    selector: 'app-verify-email',
    imports: [ButtonModule],
    templateUrl: './verify-email.html',
    styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit, OnDestroy {
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(NotifyService);
    private readonly navigation = inject(NavigationService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    protected readonly loadingService = inject(LoadingService);

    private returnUrl: string | null = null;

    protected readonly VERIFY_KEY = VERIFY_KEY;
    protected readonly RESEND_KEY = RESEND_KEY;

    protected email = '';
    protected digits: string[] = ['', '', '', '', '', ''];
    protected readonly cooldownRemaining = signal(0);
    protected submitError = '';

    private cooldownTimer: ReturnType<typeof setInterval> | null = null;

    @ViewChildren('digitInput') private digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

    ngOnInit(): void {
        const stateEmail = (history.state?.email as string | undefined) ?? '';
        const storedEmail = sessionStorage.getItem(STORAGE_KEY) ?? '';
        this.email = stateEmail || storedEmail;

        const rawReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (rawReturnUrl && rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//')) {
            this.returnUrl = rawReturnUrl;
        }

        if (!this.email) {
            this.navigation.goToLogin();
            return;
        }

        sessionStorage.setItem(STORAGE_KEY, this.email);
        this.refreshCooldownFromServer();
    }

    private refreshCooldownFromServer(): void {
        this.authService.getVerificationStatus(this.email).subscribe({
            next: (res) => {
                if (!res.isSuccess) return;
                if (res.value.isVerified) {
                    this.navigation.goToLogin();
                    return;
                }
                if (res.value.cooldownRemainingSeconds > 0) {
                    this.startCooldown(res.value.cooldownRemainingSeconds);
                } else {
                    this.cooldownRemaining.set(0);
                }
            },
        });
    }

    ngOnDestroy(): void {
        if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    }

    protected onDigitInput(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        const raw = input.value.replace(/\D/g, '');

        if (raw.length > 1) {
            this.distribute(raw, index);
            return;
        }

        this.digits[index] = raw;
        input.value = raw;

        if (raw && index < 5) {
            this.focusInput(index + 1);
        }

        this.submitError = '';
        if (this.isComplete()) {
            this.submit();
        }
    }

    protected onKeydown(index: number, event: KeyboardEvent): void {
        if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
            this.focusInput(index - 1);
            this.digits[index - 1] = '';
            return;
        }
        if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault();
            this.focusInput(index - 1);
        }
        if (event.key === 'ArrowRight' && index < 5) {
            event.preventDefault();
            this.focusInput(index + 1);
        }
    }

    protected onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pasted = event.clipboardData?.getData('text') ?? '';
        const digits = pasted.replace(/\D/g, '').slice(0, 6);
        if (!digits) return;
        this.distribute(digits, 0);
    }

    protected submit(): void {
        if (!this.isComplete()) {
            this.submitError = 'Enter all 6 digits';
            return;
        }

        const data: VerifyEmailDTO = {
            email: this.email,
            code: this.digits.join(''),
        };

        this.loadingService.start(VERIFY_KEY);
        this.authService
            .verifyEmail(data)
            .pipe(finalize(() => this.loadingService.stop(VERIFY_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        sessionStorage.removeItem(STORAGE_KEY);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Welcome to Foodlyn',
                            detail: 'Your email has been verified',
                            life: 2500,
                        });
                        const target = this.returnUrl;
                        setTimeout(() => {
                            if (target) {
                                this.router.navigateByUrl(target);
                            } else {
                                this.navigation.goToDashboard();
                            }
                        }, 400);
                    } else {
                        this.submitError = res.error ?? 'Invalid code';
                        this.clearCode();
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.submitError = err.error?.error ?? 'Invalid code';
                    this.clearCode();
                },
            });
    }

    protected resend(): void {
        if (this.cooldownRemaining() > 0) return;

        this.loadingService.start(RESEND_KEY);
        this.authService
            .resendVerificationCode({ email: this.email })
            .pipe(finalize(() => this.loadingService.stop(RESEND_KEY)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Code sent',
                            detail: `A new code was sent to ${this.email}`,
                            life: 3000,
                        });
                        this.startCooldown();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: res.error ?? 'Could not resend code',
                            life: 3500,
                        });
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.error ?? 'Could not resend code',
                        life: 3500,
                    });
                },
            });
    }

    protected goToLogin(): void {
        this.navigation.goToLogin();
    }

    private isComplete(): boolean {
        return this.digits.every((d) => d.length === 1);
    }

    private distribute(value: string, startIndex: number): void {
        const chars = value.replace(/\D/g, '').split('').slice(0, 6 - startIndex);
        chars.forEach((c, i) => {
            this.digits[startIndex + i] = c;
        });
        const inputs = this.digitInputs?.toArray() ?? [];
        inputs.forEach((ref, i) => {
            ref.nativeElement.value = this.digits[i] ?? '';
        });
        const nextIndex = Math.min(startIndex + chars.length, 5);
        this.focusInput(nextIndex);
        this.submitError = '';
        if (this.isComplete()) {
            this.submit();
        }
    }

    private focusInput(index: number): void {
        const inputs = this.digitInputs?.toArray() ?? [];
        inputs[index]?.nativeElement.focus();
        inputs[index]?.nativeElement.select();
    }

    private clearCode(): void {
        this.digits = ['', '', '', '', '', ''];
        const inputs = this.digitInputs?.toArray() ?? [];
        inputs.forEach((ref) => (ref.nativeElement.value = ''));
        this.focusInput(0);
    }

    private startCooldown(seconds: number = RESEND_COOLDOWN_SECONDS): void {
        this.cooldownRemaining.set(seconds);
        if (this.cooldownTimer) clearInterval(this.cooldownTimer);
        this.cooldownTimer = setInterval(() => {
            const next = this.cooldownRemaining() - 1;
            this.cooldownRemaining.set(Math.max(next, 0));
            if (next <= 0 && this.cooldownTimer) {
                clearInterval(this.cooldownTimer);
                this.cooldownTimer = null;
            }
        }, 1000);
    }
}
