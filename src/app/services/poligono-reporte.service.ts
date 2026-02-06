/**
 * Servicio de reportes de polígonos.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ReportePoligonoPorLoteResponse,
  ReportePoligonoPorLoteItem
} from '../interfaces/ReportePoligonoPorLote.interface';
import {
  ReportePoligonoPorEstadoResponse,
  ReportePoligonoPorEstadoItem
} from '../interfaces/ReportePoligonoPorEstado.interface';
import {
  ReporteUnidadCatastralPorEstadoResponse,
  ReporteUnidadCatastralPorEstadoItem
} from '../interfaces/ReporteUnidadCatastralPorEstado.interface';
import {
  ReportePoligonoPorDistritoResponse,
  ReportePoligonoPorDistritoItem
} from '../interfaces/ReportePoligonoPorDistrito.interface';
import {
  PoligonoListaEtapasResponse,
  PoligonoListaEtapasItem
} from '../interfaces/PoligonoListaEtapas.interface';

@Injectable({ providedIn: 'root' })
export class PoligonoReporteService {
  private readonly baseUrlReportePorEstado = `${environment.apiSicuVisorSeguimiento}poligono/reporteporestado`;
  private readonly baseUrlReportePorLote = `${environment.apiSicuVisorSeguimiento}poligono/reporteporlote`;
  private readonly baseUrlReportePorDistrito = `${environment.apiSicuVisorSeguimiento}poligono/reportepordistrito`;
  private readonly baseUrlListaEtapas = `${environment.apiSicuVisorSeguimiento}poligono/listaretapas`;
  private readonly baseUrlReporteUnidadCatastral = `${environment.apiSicuVisorSeguimiento}unidadcatastral/reporteporestado`;

  constructor(private http: HttpClient) {}

  /**
   * Reporte total de polígonos por estado (q1, q2, cic, qa3, qa4, muni y porcentajes). Un registro agregado para los ubigeos.
   */
  getReportePorEstado(ubigeos: string[]): Observable<ReportePoligonoPorEstadoItem | null> {
    if (!ubigeos?.length) return of(null);
    const params = new HttpParams().set('ubigeos', ubigeos.join(','));
    return this.http.get<ReportePoligonoPorEstadoResponse>(this.baseUrlReportePorEstado, { params }).pipe(
      map(res => (res?.success && res?.data?.length ? res.data[0] : null))
    );
  }

  /**
   * Reporte por distrito: totales de polígonos (q1, q2, cic, qa3, qa4, muni, totalPoligonos) por distrito.
   */
  getReportePorDistrito(ubigeos: string[]): Observable<ReportePoligonoPorDistritoItem[]> {
    if (!ubigeos?.length) return of([]);
    const params = new HttpParams().set('ubigeos', ubigeos.join(','));
    return this.http.get<ReportePoligonoPorDistritoResponse>(this.baseUrlReportePorDistrito, { params }).pipe(
      map(res => (res?.success && Array.isArray(res?.data) ? res.data : []))
    );
  }

  /**
   * Reporte por lote: totales de polígonos (q1, q2, cic, qa3, qa4, muni) por lote, filtrado por ubigeos.
   */
  getReportePorLote(ubigeos: string[]): Observable<ReportePoligonoPorLoteItem[]> {
    if (!ubigeos?.length) {
      return of([]);
    }
    const params = new HttpParams().set('ubigeos', ubigeos.join(','));
    return this.http.get<ReportePoligonoPorLoteResponse>(this.baseUrlReportePorLote, { params }).pipe(
      map(res => (res?.success && Array.isArray(res?.data) ? res.data : []))
    );
  }

  /**
   * Lista de etapas por polígono (tabla: departamento, provincia, distrito, lote, polígono, UUCC, QA1–MUN, conformidad).
   */
  getListaEtapas(ubigeos: string[]): Observable<PoligonoListaEtapasItem[]> {
    if (!ubigeos?.length) return of([]);
    const params = new HttpParams().set('ubigeos', ubigeos.join(','));
    return this.http.get<PoligonoListaEtapasResponse>(this.baseUrlListaEtapas, { params }).pipe(
      map(res => (res?.success && Array.isArray(res?.data) ? res.data : []))
    );
  }

  /**
   * Total de unidades por Polígono (unidades catastrales por estado: ucQa1, ucQa2, ucCic, ucQa3, ucQa4, ucMuni).
   */
  getReporteUnidadCatastralPorEstado(ubigeos: string[]): Observable<ReporteUnidadCatastralPorEstadoItem | null> {
    if (!ubigeos?.length) return of(null);
    const params = new HttpParams().set('ubigeos', ubigeos.join(','));
    return this.http.get<ReporteUnidadCatastralPorEstadoResponse>(this.baseUrlReporteUnidadCatastral, { params }).pipe(
      map(res => (res?.success && res?.data?.length ? res.data[0] : null))
    );
  }
}
