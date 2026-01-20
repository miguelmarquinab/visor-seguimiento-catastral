import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, tap, throwError } from 'rxjs';
import { TokenStorageService} from './token-storage.service';
import {environment} from '../../../environments/environment';
import {LoginResponse} from '../../interfaces/LoginResponse';
import {LoginRequest} from '../../interfaces/LoginRequest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userNameSubject = new BehaviorSubject<string>('');
  public userName$ = this.userNameSubject.asObservable();

  constructor(private http: HttpClient, private tokenStorage: TokenStorageService) {
    const token =this.tokenStorage.get();
    if (token) {
      this.userNameSubject.next(this.extractUserNameFromToken(token));
    }
  }

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
        tap((res) => {
          // 1) guardar token
          this.tokenStorage.set(res.access_token);

          // 2) extraer "Nombre" del JWT y publicarlo para UI (menú)
          const name = this.extractUserNameFromToken(res.access_token);
          this.userNameSubject.next(name);
        }),
        catchError(this.handleError)
      );
  }

  // -------------------------
  // Helpers JWT
  // -------------------------
  logout(): void {
    this.tokenStorage.clear();
    this.userNameSubject.next('');
  }

  isLoggedIn(): boolean {
    return this.tokenStorage.has();
  }

  private extractUserNameFromToken(token: string): string {
    const payload = this.decodeJwtPayload(token);

    // Según tu captura: "Nombre": "USER, DEV TOTAL"
    const name =
      payload?.Nombre ??
      payload?.nombre ??
      payload?.name ??
      payload?.preferred_username ??
      payload?.user_name ??
      '';
    return (typeof name === 'string') ? name : '';
  }

  private decodeJwtPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
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

}
