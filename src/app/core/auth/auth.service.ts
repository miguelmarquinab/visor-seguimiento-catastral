import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { TokenStorageService} from './token-storage.service';
import {environment} from '../../../environments/environment';

export interface LoginRequest{
  username: string,
  password: string,
}

export interface LoginResponse{
  access_token: string;
  tokenTye?: string;
  expiresIn: number;
  roles?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService
  ) { }

  login(req: LoginRequest): Observable<LoginResponse> {
    const clientId = environment.clientIdSICUAccess;
    const clientSecrect = environment.clientSecretSICUAccess;

    const HTTP_OPTIONS = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + window.btoa(`${clientId}:${clientSecrect}`),
      })
    };

    const body = new HttpParams()
      .set('username', req.username)
      .set('password', req.password)
      .set('grant_type', 'custom_password')
      .set('scope', 'read,write');

    return this.http.post<LoginResponse>(`${environment.urlWebApiAuthenticate}oauth2/token`, body, HTTP_OPTIONS)
      .pipe(
        tap(res => this.tokenStorage.setToken(res.access_token)),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Ocurrió un error desconocido.';
    if (error.status === 0) {
      console.error('No se pudo conectar al backend:', error.error);
      message = 'No se pudo conectar al servidor. Por favor, intente nuevamente.';

    } else {
      console.error(`Error del servidor: ${error.status}, Detalles:`, error.error);
      message = error.error?.message || 'Error en el servidor. Verifique su solicitud.';
    }
    return throwError(() => new Error(message));
  }

  logout(): void {
    this.tokenStorage.clear();
  }

  isLoggedIn(): boolean {
    return this.tokenStorage.hasToken();
  }

}
