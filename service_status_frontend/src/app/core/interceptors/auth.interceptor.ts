import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpHeaders, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Reads auth token safely from localStorage (browser-only).
 */
function readToken(): string | null {
  try {
    const g: any = (globalThis as any);
    const ls = g?.localStorage;
    if (ls && typeof ls.getItem === 'function') {
      return ls.getItem('auth_token');
    }
  } catch {
    // ignore SSR or storage errors
  }
  return null;
}

/**
 * Determines whether a request should include the Authorization header.
 * You may extend this to exclude specific domains or routes (e.g., login).
 */
function shouldAttachAuth(req: HttpRequest<unknown>): boolean {
  // Example: do not attach for absolute third-party URLs if needed
  // For now, attach for all requests; backend can ignore if not required.
  return true;
}

// PUBLIC_INTERFACE
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  let modifiedReq = req;

  if (shouldAttachAuth(req)) {
    const token = readToken();
    if (token) {
      // If the request already has Authorization, do not override it.
      const hasAuthHeader = !!req.headers.get('Authorization');
      if (!hasAuthHeader) {
        const headers: HttpHeaders = req.headers.set('Authorization', `Bearer ${token}`);
        modifiedReq = req.clone({ headers });
      }
    }
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Centralized error hook for auth-related issues (401/403).
      // We don't redirect here automatically to keep this generic.
      return throwError(() => error);
    })
  );
};

/**
 * Helper provider to register the interceptor using provideHttpClient(withInterceptors).
 * Import and spread this in app.config.ts providers.
 */
// PUBLIC_INTERFACE
export const provideAuthInterceptor = () => provideHttpClient(withInterceptors([authInterceptor]));
