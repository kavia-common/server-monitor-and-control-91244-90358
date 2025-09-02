import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { map } from 'rxjs';

/**
 * AuthGuard protects routes by ensuring the user is authenticated.
 * If not authenticated, it redirects to /login with a returnUrl query parameter.
 */
// PUBLIC_INTERFACE
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated$.pipe(
    map((isAuth) => {
      if (isAuth) return true;
      const returnUrl = state.url || '/';
      return router.createUrlTree(['/login'], { queryParams: { returnUrl } }) as UrlTree;
    })
  );
};
