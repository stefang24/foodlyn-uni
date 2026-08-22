import { Result } from './../models/result.model';
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginDTO } from '../../features/auth/login/models/loginDTO.model';
import { OrderRealtimeService } from './order-realtime.service';

export interface CurrentUser {
    userId: number;
    email: string;
    username: string;
    fullName: string | null;
    role: string;
    restaurantId: number | null;
    profilePictureUrl: string | null;
}

export interface LogoutResponse {
    message: string;
}

export interface RegisterCustomerDTO {
    firstName: string | null;
    lastName: string | null;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}

export interface RegisterCustomerResponse {
    email: string;
    requiresVerification: boolean;
}

export interface VerifyEmailDTO {
    email: string;
    code: string;
}

export interface ResendVerificationDTO {
    email: string;
}

export interface VerificationStatus {
    isVerified: boolean;
    cooldownRemainingSeconds: number;
}

export const EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED';

export interface GuestLoginDTO {
    qrToken: string;
}

export interface GuestSession {
    restaurantId: number;
    tableId: number;
    sessionId: string;
    role: string;
}

const AUTH_FLAG_KEY = 'foodlyn_authenticated';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _currentUser = signal<CurrentUser | null>(null);
    private apiUrl = `${environment.apiUrl}/auth`;
    private readonly http: HttpClient = inject(HttpClient);
    private readonly realtime = inject(OrderRealtimeService);

    currentUser() {
        return this._currentUser();
    }

    isAuthenticated() {
        return this._currentUser() !== null;
    }

    checkRole(role: string): boolean {
        return role == this._currentUser()?.role;
    }

    hasAuthFlag(): boolean {
        return localStorage.getItem(AUTH_FLAG_KEY) === 'true';
    }

    private setAuthFlag() {
        localStorage.setItem(AUTH_FLAG_KEY, 'true');
    }

    private clearAuthFlag() {
        localStorage.removeItem(AUTH_FLAG_KEY);
    }

    login(data: LoginDTO) {
        return this.http
            .post<Result<CurrentUser>>(`${this.apiUrl}/login`, data, { withCredentials: true })
            .pipe(
                tap((res) => {
                    if (res.isSuccess) {
                        this._currentUser.set(res.value);
                        this.setAuthFlag();
                        void this.realtime.stop();
                    }
                }),
            );
    }

    logout() {
        return this.http
            .post<Result<LogoutResponse>>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
            .pipe(
                tap(() => this.clearSession()),
                catchError((err) => {
                    this.clearSession();
                    return of(null);
                }),
            );
    }

    refreshToken() {
        return this.http
            .post<Result<CurrentUser>>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
            .pipe(
                tap((res) => {
                    if (res.isSuccess) {
                        this._currentUser.set(res.value);
                        this.setAuthFlag();
                    }
                }),
            );
    }

    loadCurrentUser() {
        return this.http
            .get<Result<CurrentUser>>(`${this.apiUrl}/me`, { withCredentials: true })
            .pipe(
                tap((res) => {
                    if (res.isSuccess) {
                        this._currentUser.set(res.value);
                        this.setAuthFlag();
                    } else {
                        this.clearSession();
                    }
                }),
                catchError(() => {
                    this.clearSession();
                    return of(null);
                }),
            );
    }

    clearSession() {
        this._currentUser.set(null);
        this.clearAuthFlag();
        void this.realtime.stop();
    }

    registerCustomer(data: RegisterCustomerDTO) {
        return this.http.post<Result<RegisterCustomerResponse>>(
            `${this.apiUrl}/register-customer`,
            data,
            { withCredentials: true },
        );
    }

    verifyEmail(data: VerifyEmailDTO) {
        void this.realtime.stop();
        return this.http
            .post<Result<CurrentUser>>(`${this.apiUrl}/verify-email`, data, {
                withCredentials: true,
            })
            .pipe(
                tap((res) => {
                    if (res.isSuccess) {
                        this._currentUser.set(res.value);
                        this.setAuthFlag();
                    }
                }),
            );
    }

    resendVerificationCode(data: ResendVerificationDTO) {
        return this.http.post<Result<string>>(`${this.apiUrl}/resend-verification`, data, {
            withCredentials: true,
        });
    }

    getVerificationStatus(email: string) {
        const params = new URLSearchParams({ email });
        return this.http.get<Result<VerificationStatus>>(
            `${this.apiUrl}/verification-status?${params.toString()}`,
            { withCredentials: true },
        );
    }

    guestLogin(data: GuestLoginDTO) {
        return this.http
            .post<Result<GuestSession>>(`${this.apiUrl}/guest`, data, { withCredentials: true })
            .pipe(
                tap((res) => {
                    if (res.isSuccess) {
                        this._currentUser.set({
                            userId: 0,
                            email: '',
                            username: `guest-${res.value.sessionId.slice(0, 6)}`,
                            profilePictureUrl: null,
                            fullName: 'Guest',
                            role: res.value.role,
                            restaurantId: res.value.restaurantId,
                        });
                        this.setAuthFlag();
                    }
                }),
            );
    }
}
