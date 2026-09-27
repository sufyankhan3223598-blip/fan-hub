import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, of, shareReplay, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, MessageResponse, User } from '../models/models';

const ACCESS = 'fhp.access';
const REFRESH = 'fhp.refresh';
const USER = 'fhp.user';

export const store = {
  get(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string): void { try { localStorage.setItem(key, value); } catch {  } },
  remove(key: string): void { try { localStorage.removeItem(key); } catch {  } }
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = `${environment.apiUrl}/auth`;
  private refreshing$: Observable<string | null> | null = null;

  readonly user = signal<User | null>(this.readUser());
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'Admin');
  readonly firstName = computed(() => (this.user()?.fullName ?? '').split(' ')[0]);

  get accessToken(): string | null { return store.get(ACCESS); }
  get refreshToken(): string | null { return store.get(REFRESH); }

  register(body: { fullName: string; email: string; password: string; confirmPassword: string; categoryIds: number[] }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, body).pipe(tap(r => this.persist(r)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { email, password }).pipe(tap(r => this.persist(r)));
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string, confirmPassword: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/reset-password`, { token, password, confirmPassword });
  }

  verifyEmail(token: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/verify-email`, { token }).pipe(
      tap(() => { const u = this.user(); if (u) this.setUser({ ...u, emailVerified: true }); })
    );
  }

  sendRegistrationOtp(email: string, fullName?: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/send-registration-otp`, { email, fullName });
  }

  registerWithOtp(body: { fullName: string; email: string; password: string; confirmPassword: string; otp: string; categoryIds: number[] }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register-with-otp`, body).pipe(tap(r => this.persist(r)));
  }

  sendVerificationOtp(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/send-verification-otp`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/verify-otp`, { email, otp }).pipe(
      tap(() => { const u = this.user(); if (u) this.setUser({ ...u, emailVerified: true }); })
    );
  }

  resendVerification(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/resend-verification`, {});
  }

  resendVerificationByEmail(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/resend-verification-email`, { email });
  }


  reloadMe(): Observable<User | null> {
    if (!this.accessToken) return of(null);
    return this.http.get<User>(`${this.base}/me`).pipe(tap(u => this.setUser(u)), catchError(() => of(null)));
  }


  refresh(): Observable<string | null> {
    const token = this.refreshToken;
    if (!token) return of(null);
    if (!this.refreshing$) {
      this.refreshing$ = this.http.post<AuthResponse>(`${this.base}/refresh`, { refreshToken: token }).pipe(
        tap(r => this.persist(r)),
        map(r => r.accessToken),
        catchError(() => { this.clear(); return of(null); }),
        finalize(() => (this.refreshing$ = null)),
        shareReplay(1)
      );
    }
    return this.refreshing$;
  }

  logout(redirect = true): void {
    const token = this.refreshToken;
    if (token) this.http.post(`${this.base}/logout`, { refreshToken: token }).subscribe({ error: () => undefined });
    this.clear();
    if (redirect) this.router.navigateByUrl('/');
  }

  setUser(user: User): void {
    this.user.set(user);
    store.set(USER, JSON.stringify(user));
  }

  private persist(r: AuthResponse): void {
    store.set(ACCESS, r.accessToken);
    store.set(REFRESH, r.refreshToken);
    this.setUser(r.user);
  }

  private clear(): void {
    store.remove(ACCESS);
    store.remove(REFRESH);
    store.remove(USER);
    this.user.set(null);
  }

  private readUser(): User | null {
    const raw = store.get(USER);
    if (!raw || !store.get(REFRESH)) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  }
}
