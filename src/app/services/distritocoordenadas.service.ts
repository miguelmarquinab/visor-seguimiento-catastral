import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StatusResponse<T> {
  success: boolean;
  message: string;
  total: number;
  validations: any;
  data: T;
  type: any;
}

export interface DistritoGeoData {
  codigoDistrito: string;
  nombreDistrito: string;
  // en tu backend puede venir como geojson o geoson (lo he visto en tus screenshots)
  geojson?: string;
  geoson?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DistritocoordenadasService {

  constructor(private http: HttpClient) {}

  obtenerGeometria(codigoUbigeo: string): Observable<StatusResponse<DistritoGeoData>> {
    const params = new HttpParams().set('codigoUbigeo', codigoUbigeo);

    return this.http.get<StatusResponse<DistritoGeoData>>(
      `${environment.apiSicuVisorSeguimiento}distrito/obtenerCoordenandas`,
      { params }
    );
  }
}
