/**
 * Servicio de reportes de manzanas.
 * Consume API: reporteporestado (total por estado) y reportepordistrito (series por distrito).
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ReporteManzanaPorEstadoResponse,
  ManzanaReportePorEstadoMapeado,
  mapReporteManzanaPorEstado
} from '../interfaces/ReporteManzanaPorEstado.interface';
import {
  ReporteManzanaPorDistritoResponse,
  ReporteManzanaPorDistritoItem
} from '../interfaces/ReporteManzanaPorDistrito.interface';
import {
  ConteoEstadoItem,
  ConteoEstadosResponse
} from '../interfaces/ManzanaConteo'
import {
  buildBboxParams,
  buildUbigeosParams,
  hasUbigeos,
  mapSuccessArray,
  mapSuccessFirst
} from './reporte-http.utils';
@Injectable({ providedIn: 'root' })
export class ManzanaReporteService {
  private readonly baseUrl = `${environment.apiSicuVisorSeguimiento}manzana/reporteporestado`;
  private readonly baseUrlPorDistrito = `${environment.apiSicuVisorSeguimiento}manzana/reportepordistrito`;
  private readonly baseUrlConteo = `${environment.apiSicuVisorSeguimiento}manzana/conteoestados`;
  private readonly baseUrlConteoGeoJson = `${environment.apiSicuVisorSeguimiento}manzana/conteogeojson`;
  constructor(private readonly http: HttpClient) {}

  /**
   * Reporte general: un registro en data con totales para los ubigeos indicados.
   */
  getReportePorEstado(ubigeos: string[]): Observable<ManzanaReportePorEstadoMapeado | null> {
    if (!hasUbigeos(ubigeos)) {
      return of(null);
    }
    const params = buildUbigeosParams(ubigeos);
    return this.http.get<ReporteManzanaPorEstadoResponse>(this.baseUrl, { params }).pipe(
      map(res => {
        const item = mapSuccessFirst(res);
        if (!item) return null;
        return mapReporteManzanaPorEstado(item);
      })
    );
  }

  /**
   * Reporte por distrito: un registro por distrito con estado01, estado02, estado03, estado04, estado05, estado05 y totalManzanas.
   */
  getReportePorDistrito(ubigeos: string[]): Observable<ReporteManzanaPorDistritoItem[]> {
    if (!hasUbigeos(ubigeos)) return of([]);
    const params = buildUbigeosParams(ubigeos);
    return this.http.get<ReporteManzanaPorDistritoResponse>(this.baseUrlPorDistrito, { params }).pipe(
      map(res => mapSuccessArray(res))
    );
  }

  getConteoEstados(
    bbox: { xmin: number; ymin: number; xmax: number; ymax: number },
    ubigeos: string[] 
  ): Observable<ConteoEstadoItem[]> {
    const params = buildBboxParams(bbox, ubigeos);

    return this.http.get<ConteoEstadosResponse>(this.baseUrlConteo, { params }).pipe(
      map(res => mapSuccessArray(res))
    );
  }

  getConteoGeoJson(ubigeos: string[], geojsonObj: any): Observable<ConteoEstadoItem[]> {
    if (!hasUbigeos(ubigeos)) {
      return of([]);
    }
    const body = {
      ubigeos: ubigeos,
      geojson: JSON.stringify(geojsonObj) 
    };
    return this.http.post<ConteoEstadosResponse>(this.baseUrlConteoGeoJson, body).pipe(
      map(res => mapSuccessArray(res))
    );
  }
}
