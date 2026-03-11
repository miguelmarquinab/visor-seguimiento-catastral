import { HttpInterceptorFn } from '@angular/common/http';
import { inject} from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import {TokenStorageService} from '../auth/token-storage.service';
import { SessionstateServiceService } from '../../services/sessionstate.service.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {

  const tokenStorage = inject(TokenStorageService);
  const sessionState = inject(SessionstateServiceService);
  const router = inject(Router);
  const token = tokenStorage.get();

  let request = req;
  if (token) {
    request = req.clone({
        setHeaders: {
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
      });
  }

  return next(request).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        tokenStorage.clear();
        sessionState.reset();

        if (router.url.startsWith('/login')) {
          return throwError(() => error);
        }

        void router.navigate(['/login'], {
          queryParams: { sessionExpired: '1' },
          replaceUrl: true
        });
      }
      return throwError(() => error);
    })
  );
};
