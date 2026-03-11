import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, map, of } from 'rxjs';

export interface LoteOption {
  codigo: string;
  descripcion: string;
}

interface LoteUbigeoData {
  ubigeoToLote: Record<string, string>;
  loteToDescripcion: Record<string, string>;
}

const LOTE_ORDER = ['01', '02', '3a', '3b', '3c', '04', '05', '06', '00']; // '00' = no asignado (no pertenecen a un lote)

@Injectable({ providedIn: 'root' })
export class LoteService {
  private readonly http = inject(HttpClient);
  private readonly data$ = this.http
    .get<LoteUbigeoData>('assets/data/lote-ubigeo.json')
    .pipe(shareReplay(1));

  /** Cache para comprobaciones síncronas (p. ej. limpiar lote al quitar distritos). */
  private cachedData: LoteUbigeoData | null = null;

  constructor() {
    this.data$.subscribe((data) => {
      this.cachedData = data ?? null;
    });
  }

  /** Lista de lotes para el selector (código + descripción), ordenada. Excluye '00' (no asignado). */
  getLotes(): Observable<LoteOption[]> {
    return this.data$.pipe(
      map((data) => {
        const desc = data?.loteToDescripcion ?? {};
        return LOTE_ORDER.filter((cod) => cod in desc && cod !== '00').map((codigo) => ({
          codigo,
          descripcion: desc[codigo] ?? codigo,
        }));
      })
    );
  }

  /**
   * Ubigeos que pertenecen al lote dado.
   * Si codigoLote es '00' (no asignado), devuelve los ubigeos de allUbigeos que no están asignados a ningún lote.
   */
  getUbigeosByLote(codigoLote: string, allUbigeos?: string[]): Observable<string[]> {
    if (codigoLote === '00') {
      if (!allUbigeos?.length) return of([]);
      return this.data$.pipe(
        map((data) => {
          const mapUbigeo = data?.ubigeoToLote ?? {};
          return allUbigeos.filter((ubigeo) => !(ubigeo in mapUbigeo));
        })
      );
    }
    return this.data$.pipe(
      map((data) => {
        const mapUbigeo = data?.ubigeoToLote ?? {};
        return Object.entries(mapUbigeo)
          .filter(([, lote]) => lote === codigoLote)
          .map(([ubigeo]) => ubigeo);
      })
    );
  }

  /**
   * Versión síncrona: devuelve los ubigeos del lote si los datos ya están cargados; si no, null.
   * Permite limpiar el filtro de lote al quitar distritos sin depender del async.
   */
  getUbigeosByLoteSync(codigoLote: string, allUbigeos?: string[]): string[] | null {
    if (!this.cachedData) return null;
    const mapUbigeo = this.cachedData.ubigeoToLote ?? {};
    if (codigoLote === '00') {
      if (!allUbigeos?.length) return [];
      return allUbigeos.filter((ubigeo) => !(ubigeo in mapUbigeo));
    }
    return Object.entries(mapUbigeo)
      .filter(([, lote]) => lote === codigoLote)
      .map(([ubigeo]) => ubigeo);
  }

  /**
   * Ubigeos que pertenecen a cualquiera de los lotes dados (unión, sin duplicados).
   * Si codigos está vacío devuelve [].
   */
  getUbigeosByLotes(codigos: string[], allUbigeos?: string[]): Observable<string[]> {
    if (!codigos?.length) return of([]);
    return this.data$.pipe(
      map((data) => {
        const seen = new Set<string>();
        for (const codigo of codigos) {
          const list = codigo === '00'
            ? (allUbigeos ?? []).filter((u) => !data?.ubigeoToLote?.[u])
            : Object.entries(data?.ubigeoToLote ?? {})
                .filter(([, l]) => l === codigo)
                .map(([u]) => u);
          list.forEach((u) => seen.add(u));
        }
        return [...seen];
      })
    );
  }

  /**
   * Versión síncrona de getUbigeosByLotes. Devuelve null si los datos aún no están cargados.
   */
  getUbigeosByLotesSync(codigos: string[], allUbigeos?: string[]): string[] | null {
    if (!this.cachedData || !codigos?.length) return codigos?.length ? null : [];
    const mapUbigeo = this.cachedData.ubigeoToLote ?? {};
    const seen = new Set<string>();
    for (const codigo of codigos) {
      if (codigo === '00') {
        (allUbigeos ?? []).filter((u) => !(u in mapUbigeo)).forEach((u) => seen.add(u));
      } else {
        Object.entries(mapUbigeo)
          .filter(([, l]) => l === codigo)
          .map(([u]) => u)
          .forEach((u) => seen.add(u));
      }
    }
    return [...seen];
  }

  /** Código de lote para un ubigeo, o '00' si no tiene. */
  getLoteByUbigeo(ubigeo: string): Observable<string> {
    return this.data$.pipe(
      map((data) => data?.ubigeoToLote?.[ubigeo] ?? '00')
    );
  }

  /** Datos crudos (para usar con combineLatest si hace falta). */
  getData(): Observable<LoteUbigeoData> {
    return this.data$;
  }
}
