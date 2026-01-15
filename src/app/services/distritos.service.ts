import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {UsuarioOrganizacionesData} from '../models/usuario-organizaciones.model';
import {UsuarioOrganizacionesResponse} from '../interfaces/UsuarioOrganizacionesResponse';


@Injectable({
  providedIn: 'root'
})
export class DistritosService {

  constructor(private http: HttpClient) { }

  buscar(nombre: string, page: number = 0, size: number = 6): Observable<UsuarioOrganizacionesResponse> {
    const params = new HttpParams()
      .set('nombre', nombre ?? '')
      .set('page', page)
      .set('size', size);


    return this.http.get<UsuarioOrganizacionesResponse>(
      `${environment.urlWebApiSecurity}consultaDatosUsuarioPorNombre`,
      { params }
    );
  }
}
