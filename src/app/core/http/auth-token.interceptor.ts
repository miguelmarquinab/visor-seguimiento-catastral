import { HttpInterceptorFn } from '@angular/common/http';
import { inject} from '@angular/core';
import {TokenStorageService} from '../auth/token-storage.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  //const tokenStorage = inject(TokenStorageService);
  //const token = tokenStorage.getToken();

  const token = inject(TokenStorageService).get();

  if (!token) return next(req);

  const authReq = req.clone({
    //setHeaders: {Authorization: 'Bearer token=' + token},
    setHeaders: {Authorization: token.startsWith('Bearer ') ? token :  `Bearer ${token}`},
  });

  return next(authReq);
};
