/**
 * Servicio de reportes de manzanas.
 * Consume API: reporteporestado (total por estado) y reportepordistrito (series por distrito).
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class ManzanaReporteService {
  private readonly baseUrl = `${environment.apiSicuVisorSeguimiento}manzana/reporteporestado`;
  private readonly baseUrlPorDistrito = `${environment.apiSicuVisorSeguimiento}manzana/reportepordistrito`;

  constructor(private http: HttpClient) {}

  /**
   * Reporte general: un registro en data con totales para los ubigeos indicados.
   */
  getReportePorEstado(ubigeos: string[]): Observable<ManzanaReportePorEstadoMapeado | null> {
    if (!ubigeos?.length) {
      return of(null);
    }
    const params = new HttpParams().set('ubigeos', ubigeos.join(','));
    return this.http.get<ReporteManzanaPorEstadoResponse>(this.baseUrl, { params }).pipe(
      map(res => {
        if (!res?.success || !res?.data?.length) return null;
        const item = res.data[0];
        return mapReporteManzanaPorEstado(item);
      })
    );
  }

  /**
   * Reporte por distrito: un registro por distrito con estado01, estado02, estado03, estado04, estado05, estado05 y totalManzanas.
   */
  getReportePorDistrito(ubigeos: string[]): Observable<ReporteManzanaPorDistritoItem[]> {
    if (!ubigeos?.length) return of([]);
    const params = new HttpParams().set('ubigeos', ubigeos.join(','));
    return this.http.get<ReporteManzanaPorDistritoResponse>(this.baseUrlPorDistrito, { params }).pipe(
      map(res => (res?.success && Array.isArray(res?.data) ? res.data : []))
    );
  }
}
