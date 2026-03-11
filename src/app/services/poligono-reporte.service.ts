/**
 * Servicio de reportes de polígonos.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
import {
  ConteoEstadoItem,
  ConteoEstadosResponse
} from '../interfaces/PoligonoConteo'
import {
  buildBboxParams,
  buildUbigeosParams,
  hasUbigeos,
  mapSuccessArray,
  mapSuccessFirst
} from './reporte-http.utils';
@Injectable({ providedIn: 'root' })
export class PoligonoReporteService {
  private readonly baseUrlReportePorEstado = `${environment.apiSicuVisorSeguimiento}poligono/reporteporestado`;
  private readonly baseUrlReportePorLote = `${environment.apiSicuVisorSeguimiento}poligono/reporteporlote`;
  private readonly baseUrlReportePorDistrito = `${environment.apiSicuVisorSeguimiento}poligono/reportepordistrito`;
  private readonly baseUrlListaEtapas = `${environment.apiSicuVisorSeguimiento}poligono/listaretapas`;
  private readonly baseUrlReporteUnidadCatastral = `${environment.apiSicuVisorSeguimiento}unidadcatastral/reporteporestado`;
  private readonly baseUrlConteo = `${environment.apiSicuVisorSeguimiento}poligono/conteoestados`;
  private readonly baseUrlConteoGeoJson = `${environment.apiSicuVisorSeguimiento}poligono/conteogeojson`;
  private readonly ORDEN_ESTADOS: Record<string, number> = {
      'QA1': 1,
      'QA2': 2,
      'CIC': 3,
      'QA3': 4,
      'QA4': 5,
      'MUNI': 6
    };
  constructor(private readonly http: HttpClient) {}

  /**
   * Reporte total de polígonos por estado (q1, q2, cic, qa3, qa4, muni y porcentajes). Un registro agregado para los ubigeos.
   */
  getReportePorEstado(ubigeos: string[]): Observable<ReportePoligonoPorEstadoItem | null> {
    if (!hasUbigeos(ubigeos)) return of(null);
    const params = buildUbigeosParams(ubigeos);
    return this.http.get<ReportePoligonoPorEstadoResponse>(this.baseUrlReportePorEstado, { params }).pipe(
      map(res => mapSuccessFirst(res))
    );
  }

  /**
   * Reporte por distrito: totales de polígonos (q1, q2, cic, qa3, qa4, muni, totalPoligonos) por distrito.
   */
  getReportePorDistrito(ubigeos: string[]): Observable<ReportePoligonoPorDistritoItem[]> {
    if (!hasUbigeos(ubigeos)) return of([]);
    const params = buildUbigeosParams(ubigeos);
    return this.http.get<ReportePoligonoPorDistritoResponse>(this.baseUrlReportePorDistrito, { params }).pipe(
      map(res => mapSuccessArray(res))
    );
  }

  /**
   * Reporte por lote: totales de polígonos (q1, q2, cic, qa3, qa4, muni) por lote, filtrado por ubigeos.
   */
  getReportePorLote(ubigeos: string[]): Observable<ReportePoligonoPorLoteItem[]> {
    if (!hasUbigeos(ubigeos)) {
      return of([]);
    }
    const params = buildUbigeosParams(ubigeos);
    return this.http.get<ReportePoligonoPorLoteResponse>(this.baseUrlReportePorLote, { params }).pipe(
      map(res => mapSuccessArray(res))
    );
  }

  /**
   * Lista de etapas por polígono (tabla paginada). page 1-based (mínimo 1), size por página.
   */
  getListaEtapas(
    ubigeos: string[],
    page: number = 1,
    size: number = 10
  ): Observable<{ data: PoligonoListaEtapasItem[]; total: number }> {
    if (!hasUbigeos(ubigeos)) return of({ data: [], total: 0 });
    const pageParam = Math.max(1, page);
    const params = buildUbigeosParams(ubigeos, {
      page: pageParam,
      size
    });
    return this.http.get<PoligonoListaEtapasResponse>(this.baseUrlListaEtapas, { params }).pipe(
      map(res => ({
        data: mapSuccessArray(res),
        total: res?.total ?? 0
      }))
    );
  }

  /**
   * Total de unidades por Polígono (unidades catastrales por estado: ucQa1, ucQa2, ucCic, ucQa3, ucQa4, ucMuni).
   */
  getReporteUnidadCatastralPorEstado(ubigeos: string[]): Observable<ReporteUnidadCatastralPorEstadoItem | null> {
    if (!hasUbigeos(ubigeos)) return of(null);
    const params = buildUbigeosParams(ubigeos);
    return this.http.get<ReporteUnidadCatastralPorEstadoResponse>(this.baseUrlReporteUnidadCatastral, { params }).pipe(
      map(res => mapSuccessFirst(res))
    );
  }

  getConteoEstados(
    bbox: { xmin: number; ymin: number; xmax: number; ymax: number },
    ubigeos: string[] 
  ): Observable<ConteoEstadoItem[]> {
    const params = buildBboxParams(bbox, ubigeos);

    return this.http.get<ConteoEstadosResponse>(this.baseUrlConteo, { params }).pipe(
      map(res => {
        const data = mapSuccessArray(res);
        
        // Aplicamos el ordenamiento antes de devolver los datos
        return data.sort((a, b) => {
          const prioridadA = this.ORDEN_ESTADOS[a.estado] ?? 99;
          const prioridadB = this.ORDEN_ESTADOS[b.estado] ?? 99;
          return prioridadA - prioridadB;
        });
      })
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
      map(res => {
        const data = mapSuccessArray(res);

        return data.sort((a, b) => {
          const prioridadA = this.ORDEN_ESTADOS[a.estado] ?? 99;
          const prioridadB = this.ORDEN_ESTADOS[b.estado] ?? 99;
          return prioridadA - prioridadB;
        });
      })
    );
  }
}
