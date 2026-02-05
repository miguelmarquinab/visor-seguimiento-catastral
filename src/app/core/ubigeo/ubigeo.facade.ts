import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { UbigeoService } from './ubigeo.service';
import { Option, UbigeoItemDto } from '../../interfaces/UbigeoItemDto';

@Injectable({ providedIn: 'root' })
export class UbigeoFacade {
  private dataSubject = new BehaviorSubject<UbigeoItemDto[]>([]);
  data$ = this.dataSubject.asObservable();

  constructor(private api: UbigeoService) {}

  preload(): void {
    if (this.dataSubject.value.length > 0) return;
    this.api.listar().subscribe({
      next: (data) => this.dataSubject.next(data),
      error: (err) => {
        console.error('Error cargando ubigeo', err);
        this.dataSubject.next([]);
      }
    });
  }

  /** Datos filtrados por lista de ubigeos permitidos para el usuario logado. */
  getFilteredData(allowedUbigeos: string[]): Observable<UbigeoItemDto[]> {
    if (!allowedUbigeos?.length) return this.data$;
    const set = new Set(allowedUbigeos);
    return this.data$.pipe(map(data => data.filter(x => set.has(x.codigoUbigeo))));
  }

  getFilteredDepartamentos$(allowed: string[]): Observable<Option[]> {
    return this.getFilteredData(allowed).pipe(
      map(data => this.toOptions([...new Set(data.map(x => x.departamento).filter(Boolean))]))
    );
  }

  getFilteredProvincias$(allowed: string[], departamento: string): Observable<Option[]> {
    if (!departamento) return of([]);
    return this.getFilteredData(allowed).pipe(
      map(data => data.filter(x => x.departamento === departamento)),
      map(rows => this.toOptions([...new Set(rows.map(x => x.provincia).filter(Boolean))]))
    );
  }

  getFilteredDistritos$(allowed: string[], departamento: string, provincia: string): Observable<Option[]> {
    if (!departamento || !provincia) return of([]);
    return this.getFilteredData(allowed).pipe(
      map(data => data.filter(x => x.departamento === departamento && x.provincia === provincia && x.distrito)),
      map(rows => {
        const options: Option[] = rows.map(x => ({ value: x.codigoUbigeo || '', label: x.distrito || '' }));
        const uniqueMap = new Map<string, Option>();
        options.forEach(opt => { if (opt.value) uniqueMap.set(opt.value, opt); });
        return Array.from(uniqueMap.values()).sort((a, b) => (a.label || '').localeCompare(b.label || ''));
      })
    );
  }

  departamentos$ = this.data$.pipe(
    map(data => this.toOptions([...new Set(data.map(x => x.departamento).filter(Boolean))]))
  );

  provincias$(departamento: string): Observable<Option[]> {
    return this.data$.pipe(
      map(data => data.filter(x => x.departamento === departamento)),
      map(rows => this.toOptions([...new Set(rows.map(x => x.provincia).filter(Boolean))]))
    );
  }

  distritos$(departamento: string, provincia: string) {
    return this.data$.pipe(
      map(data => {
        // 1. Filtrado riguroso
        const filtered = data.filter(x =>
          x.departamento === departamento &&
          x.provincia === provincia &&
          x.distrito // Aseguramos que el nombre del distrito exista
        );

        // 2. Mapeo usando los nombres reales del JSON (codigoUbigeo)
        const options: Option[] = filtered.map(x => ({
          // Usamos codigoUbigeo que es lo que viene en tu JSON
          value: x.codigoUbigeo || '',
          label: x.distrito || ''
        }));

        // 3. Eliminación de duplicados (evitando que el Map use llaves undefined)
        const uniqueMap = new Map<string, Option>();
        options.forEach(opt => {
          if (opt.value) uniqueMap.set(opt.value, opt);
        });

        const uniqueOptions = Array.from(uniqueMap.values());

        // 4. Ordenado SEGURO (blindado contra nulos)
        return uniqueOptions.sort((a, b) =>
          (a.label || '').localeCompare(b.label || '')
        );
      })
    );
  }

  private toOptions(values: string[]): Option[] {
    return values
      .filter(Boolean)
      .sort((a,b) => a.localeCompare(b))
      .map(v => ({ value: v, label: v }));
  }
}
