import { inject, Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ServiceSummary,
  UserInfo,
  ProcessInfo,
  TerminateRequest,
  TerminateResponse,
} from '../models';

/**
 * ApiService centralizes all REST interactions with the backend.
 * It reads base URLs from Angular environments to avoid hardcoding configuration.
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  private get apiBaseUrl(): string {
    // Do not hardcode URLs; read from environment
    return environment.apiBaseUrl?.replace(/\/+$/, '') || '';
  }

  private createHeaders(extra?: Record<string, string | undefined>): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    // Optionally include auth token from localStorage or a future AuthService (browser only)
    const token = this.safeGetToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          headers = headers.set(k, String(v));
        }
      });
    }
    return headers;
  }

  private handleError(error: HttpErrorResponse) {
    // Centralized error handling for REST calls
    let message = 'Unknown error';
    const isClientError =
      (globalThis as any)?.ErrorEvent && error.error instanceof (globalThis as any).ErrorEvent;
    if (isClientError) {
      message = `Client/network error: ${error.error.message}`;
    } else {
      message = `Server error: ${error.status} ${error.statusText || ''}`;
      if (error.error?.message) {
        message += ` - ${error.error.message}`;
      }
    }
    return throwError(() => new Error(message));
  }

  /** Safely read token from localStorage only in browser context. */
  private safeGetToken(): string | null {
    try {
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
  private safeSetToken(token?: string) {
    try {
      if (!token) return;
      const g: any = (globalThis as any);
      const ls = g?.localStorage;
      if (ls && typeof ls.setItem === 'function') {
        ls.setItem('auth_token', token);
      }
    } catch {
      // ignore
    }
  }

  /** Safely clear token from localStorage only in browser context. */
  private safeClearToken() {
    try {
      const g: any = (globalThis as any);
      const ls = g?.localStorage;
      if (ls && typeof ls.removeItem === 'function') {
        ls.removeItem('auth_token');
      }
    } catch {
      // ignore
    }
  }

  // PUBLIC_INTERFACE
  /** Fetch list of monitored services. */
  getServices(params?: { query?: string; status?: string }): Observable<ServiceSummary[]> {
    const url = `${this.apiBaseUrl}/services`;
    let httpParams = new HttpParams();
    if (params?.query) httpParams = httpParams.set('q', params.query);
    if (params?.status) httpParams = httpParams.set('status', params.status);

    return this.http
      .get<ServiceSummary[]>(url, {
        headers: this.createHeaders(),
        params: httpParams,
      })
      .pipe(catchError(this.handleError));
  }

  // PUBLIC_INTERFACE
  /** Fetch users associated with a given service. */
  getServiceUsers(serviceId: string): Observable<UserInfo[]> {
    const url = `${this.apiBaseUrl}/services/${encodeURIComponent(serviceId)}/users`;
    return this.http
      .get<UserInfo[]>(url, { headers: this.createHeaders() })
      .pipe(catchError(this.handleError));
  }

  // PUBLIC_INTERFACE
  /** Fetch processes associated with a given service. */
  getServiceProcesses(serviceId: string): Observable<ProcessInfo[]> {
    const url = `${this.apiBaseUrl}/services/${encodeURIComponent(serviceId)}/processes`;
    return this.http
      .get<ProcessInfo[]>(url, { headers: this.createHeaders() })
      .pipe(catchError(this.handleError));
  }

  // PUBLIC_INTERFACE
  /** Terminate a specific user by ID (optionally scoped to a service). */
  terminateUser(userId: string, payload?: Partial<TerminateRequest> & { serviceId?: string }): Observable<TerminateResponse> {
    const url = `${this.apiBaseUrl}/terminate/user/${encodeURIComponent(userId)}`;
    const body: TerminateRequest = {
      targetType: 'user',
      targetId: userId,
      serviceId: payload?.serviceId,
      force: payload?.force,
      reason: payload?.reason,
      requestedBy: payload?.requestedBy,
    };
    return this.http
      .post<TerminateResponse>(url, body, { headers: this.createHeaders() })
      .pipe(catchError(this.handleError));
  }

  // PUBLIC_INTERFACE
  /** Terminate a specific process by PID (optionally scoped to a service). */
  terminateProcess(pid: string | number, payload?: Partial<TerminateRequest> & { serviceId?: string }): Observable<TerminateResponse> {
    const pidStr = String(pid);
    const url = `${this.apiBaseUrl}/terminate/process/${encodeURIComponent(pidStr)}`;
    const body: TerminateRequest = {
      targetType: 'process',
      targetId: pid,
      serviceId: payload?.serviceId,
      force: payload?.force,
      reason: payload?.reason,
      requestedBy: payload?.requestedBy,
    };
    return this.http
      .post<TerminateResponse>(url, body, { headers: this.createHeaders() })
      .pipe(catchError(this.handleError));
  }

  // PUBLIC_INTERFACE
  /** Authenticate a user with username and password. Stores token if provided. */
  login(username: string, password: string): Observable<{ token?: string; user?: UserInfo }> {
    const url = `${this.apiBaseUrl}/auth/login`;
    return this.http
      .post<{ token?: string; user?: UserInfo }>(
        url,
        { username, password },
        { headers: this.createHeaders() },
      )
      .pipe(
        map((resp) => {
          if (resp?.token) {
            this.safeSetToken(resp.token);
          }
          return resp;
        }),
        catchError(this.handleError),
      );
  }

  // PUBLIC_INTERFACE
  /** Clear local authentication token (client-side). */
  logout(): void {
    this.safeClearToken();
  }

  // PUBLIC_INTERFACE
  /** Retrieve current user profile from backend if supported. */
  me(): Observable<UserInfo> {
    const url = `${this.apiBaseUrl}/auth/me`;
    return this.http
      .get<UserInfo>(url, { headers: this.createHeaders() })
      .pipe(catchError(this.handleError));
  }
}
