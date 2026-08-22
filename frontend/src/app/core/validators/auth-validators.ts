import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 120;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 100;

export const nameValidators = [Validators.maxLength(NAME_MAX_LENGTH)];

export const usernameValidators = [
    Validators.required,
    Validators.minLength(USERNAME_MIN_LENGTH),
    Validators.maxLength(USERNAME_MAX_LENGTH),
    Validators.pattern(USERNAME_PATTERN),
];

export const emailValidators = [
    Validators.required,
    Validators.email,
    Validators.maxLength(EMAIL_MAX_LENGTH),
];

export const passwordValidators = [
    Validators.required,
    Validators.minLength(PASSWORD_MIN_LENGTH),
    Validators.maxLength(PASSWORD_MAX_LENGTH),
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailOrUsernameValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value ?? '').trim();
    if (!value) return null;
    if (EMAIL_PATTERN.test(value)) return null;
    if (
        value.length >= USERNAME_MIN_LENGTH &&
        value.length <= USERNAME_MAX_LENGTH &&
        USERNAME_PATTERN.test(value)
    ) {
        return null;
    }
    return { emailOrUsername: true };
}

export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordsMismatch: true };
}
