import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { TokenStorageService} from './token-storage.service';
import {environment} from '../../../environments/environment';
import {LoginResponse} from '../../interfaces/LoginResponse';
import {LoginRequest} from '../../interfaces/LoginRequest';
import { SessionstateServiceService} from '../../services/sessionstate.service.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private readonly http: HttpClient, private readonly tokenStorage: TokenStorageService, private  readonly sesionState: SessionstateServiceService) { }

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
        tap(res => this.tokenStorage.set(res.access_token)),
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
    this.sesionState.reset();

  }

  isLoggedIn(): boolean {
    return this.tokenStorage.has();
  }

}
