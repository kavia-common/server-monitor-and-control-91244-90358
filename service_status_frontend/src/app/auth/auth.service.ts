import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';
import { ApiService } from '../core/services';
import { UserInfo } from '../core/models';

/**
 * AuthService handles authentication state, token management, and user profile retrieval.
 * It stores the token in localStorage (browser-only) and exposes an observable auth state.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  /** In-memory cached token (used primarily for SSR safety) */
  private tokenCache: string | null = null;

  /** BehaviorSubject to maintain current authentication state */
  private readonly authState$ = new BehaviorSubject<{
    isAuthenticated: boolean;
    token: string | null;
    user: UserInfo | null;
  }>({ isAuthenticated: this.safeReadToken() !== null, token: this.safeReadToken(), user: null });

  constructor() {
    // Attempt to load token and optionally user profile on init (browser only).
    const token = this.safeReadToken();
    if (token) {
      this.tokenCache = token;
      // Optionally try to fetch user profile; if it fails, keep token-only state.
      this.api.me().subscribe({
        next: (user) => this.authState$.next({ isAuthenticated: true, token, user }),
        error: () => this.authState$.next({ isAuthenticated: true, token, user: null }),
      });
    }
  }

  // PUBLIC_INTERFACE
  /** Observable of the full authentication state (token and user). */
  get auth$(): Observable<{ isAuthenticated: boolean; token: string | null; user: UserInfo | null }> {
    return this.authState$.asObservable();
  }

  // PUBLIC_INTERFACE
  /** Observable boolean indicating whether a user is authenticated. */
  get isAuthenticated$(): Observable<boolean> {
    return this.auth$.pipe(map((s) => s.isAuthenticated));
  }

  // PUBLIC_INTERFACE
  /** Current token value (if any). Prefer using the interceptor for attaching headers. */
  get token(): string | null {
    return this.authState$.value.token;
  }

  // PUBLIC_INTERFACE
  /** Perform login with username and password, store token and update state. */
  login(username: string, password: string): Observable<{ token?: string; user?: UserInfo }> {
    return this.api.login(username, password).pipe(
      tap((resp) => {
        const token = resp?.token || null;
        this.safeWriteToken(token);
        this.authState$.next({
          isAuthenticated: !!token,
          token,
          user: resp?.user ?? null,
        });
      })
    );
  }

  // PUBLIC_INTERFACE
  /** Clear authentication token and user state and notify observers. */
  logout(): void {
    this.api.logout();
    this.safeClearToken();
    this.authState$.next({ isAuthenticated: false, token: null, user: null });
  }

  // PUBLIC_INTERFACE
  /** Try to refresh or load the user profile if authenticated. */
  refreshProfile(): Observable<UserInfo | null> {
    const cur = this.authState$.value;
    if (!cur.token) return of(null);
    return this.api.me().pipe(
      tap({
        next: (user) => this.authState$.next({ ...cur, user }),
        error: () => this.authState$.next({ ...cur, user: null }),
      }),
      map((u) => u ?? null)
    );
  }

  /** Safely read token from localStorage only in browser context. */
  private safeReadToken(): string | null {
    try {
      if (this.tokenCache) return this.tokenCache;
      const g: any = (globalThis as any);
      const ls = g?.localStorage;
      if (ls && typeof ls.getItem === 'function') {
        return ls.getItem('auth_token');
      }
    } catch {
      // ignore
    }
    return null;
  }

  /** Safely write token to localStorage only in browser context. */
  private safeWriteToken(token: string | null): void {
    this.tokenCache = token;
    try {
      const g: any = (globalThis as any);
      const ls = g?.localStorage;
      if (ls && typeof ls.setItem === 'function') {
        if (token) {
          ls.setItem('auth_token', token);
        } else {
          ls.removeItem('auth_token');
        }
      }
    } catch {
      // ignore
    }
  }

  /** Safely clear token from localStorage only in browser context. */
  private safeClearToken(): void {
    this.safeWriteToken(null);
  }
}
