import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoadingService, ToastService } from '../services/ui.services';

export const SILENT = new HttpContextToken<boolean>(() => false);

export const SHOW_LOADER = new HttpContextToken<boolean>(() => false);

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/refresh') || req.url.includes('/auth/register');
  return next(withToken(req, isAuthCall ? null : auth.accessToken)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthCall || !auth.refreshToken) return throwError(() => err);
      return auth.refresh().pipe(
        switchMap(token => {
          if (!token) return throwError(() => err);
          return next(withToken(req, token));
        })
      );
    })
  );
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!req.context.get(SILENT)) {
        const message = (err.error && (err.error.message || err.error.title)) || err.message;
        if (err.status === 0) toast.error('Connection problem', 'The Fan Hub Plus API could not be reached. Is it running?');
        else if (err.status === 401) {
          if (auth.isLoggedIn()) { auth.logout(false); }
          toast.info('Please sign in', 'Your session has ended.');
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        } else if (err.status === 403) toast.error('Access denied', message);
        else if (err.status === 404) toast.warning('Not found', message);
        else if (err.status === 429) toast.warning('Slow down', 'Too many attempts. Please wait a minute.');
        else toast.error('Something went wrong', message);
      }
      return throwError(() => err);
    })
  );
};

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(SHOW_LOADER)) return next(req);
  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};
