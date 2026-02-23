import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DistritosService } from '../../../../services/distritos.service';
import { Router } from '@angular/router';
import { Distrito } from '../../../../interfaces/Distrito';
import { UiStateService } from '../../../../services/ui-state.service';
import { MapaComponent } from '../../mapa/mapa.component';
import { ControlCapasComponent } from '../../control-capas/control-capas.component';
import { MatIconModule } from '@angular/material/icon';
import { MapModalReporteMapaComponent } from '../../widgets/map-modal-reporte-mapa/map-modal-reporte-mapa.component';
import { MapService } from '../../../../services/map.service';
import { DistritocoordenadasService } from '../../../../services/distritocoordenadas.service';
import * as L from 'leaflet';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MapaComponent,
    ControlCapasComponent,
    MapModalReporteMapaComponent,
    MatIconModule
  ],
  templateUrl: './distritos.component.html',
  styleUrls: ['./distritos.component.css'],
})
export class DistritosComponent implements OnInit {
  search = new FormControl('');
  /** Lista que se muestra en la grilla (puede estar filtrada por búsqueda). */
  items: Distrito[] = [];
  /** Lista completa de distritos del usuario (solo se actualiza al cargar sin filtro, para Reporte Espacial). */
  private fullListDistritos: Distrito[] = [];
  loading = false;

  private readonly selectedMap = new Map<number, Distrito>();

  constructor(
    private readonly distritos: DistritosService,
    private readonly router: Router,
    public ui: UiStateService,
    private readonly mapService: MapService,
    private readonly distritoCoords: DistritocoordenadasService
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('distritos_seleccionados');
    if (saved) {
      try {
        const arr: Distrito[] = JSON.parse(saved);
        arr.forEach(d => this.selectedMap.set(d.idOrganizacion, d));
      } catch {}
    }
    this.cargar('', 0);
  }

  onBuscar(): void {
    const q = (this.search.value ?? '').trim();
    this.cargar(q, 0);
  }

  onEnter(ev: KeyboardEvent): void {
    if (ev.key === 'Enter') this.onBuscar();
  }

  toggle(d: Distrito): void {
    const id = d.idOrganizacion;
    if (this.selectedMap.has(id)) this.selectedMap.delete(id);
    else this.selectedMap.set(id, d);
  }

  isSelected(d: Distrito): boolean {
    return this.selectedMap.has(d.idOrganizacion);
  }

  get selectedCount(): number {
    return this.selectedMap.size;
  }

  get todosSeleccionados(): boolean {
    return this.items.length > 0 && this.items.every(d => this.selectedMap.has(d.idOrganizacion));
  }

  seleccionarTodos(): void {
    this.items.forEach(d => this.selectedMap.set(d.idOrganizacion, d));
  }

  deseleccionarTodos(): void {
    this.items.forEach(d => this.selectedMap.delete(d.idOrganizacion));
  }

  agregar(): void {
    const selected = Array.from(this.selectedMap.values());
    if (selected.length === 0) return;

    selected.sort((a, b) => (a.distrito ?? '').localeCompare(b.distrito ?? ''));

    this.ui.setAllDistritos(this.fullListDistritos.length > 0 ? this.fullListDistritos : this.items);
    localStorage.setItem('distritos_seleccionados', JSON.stringify(selected));
    this.ui.setDistritos(selected);
    this.ui.setShowManzanaPanel(false);
    this.ui.setShowPoligonoPanel(false);
    this.ui.setShowStatsWidget(true);

    const ubigeos = selected
      .map(x => x.codigoUbigeo)
      .filter((u): u is string => !!u);

    this.pintarLimitesDistritosCuandoMapaEsteListo(ubigeos);

    const firstUbigeo = selected[0]?.codigoUbigeo;
    if (firstUbigeo) {
      this.centrarPrimerDistritoCuandoMapaEsteListo(firstUbigeo);
    }
  }

  private pintarLimitesDistritosCuandoMapaEsteListo(ubigeos: string[]): void {
    let intentos = 0;
    const maxIntentos = 30;

    const timer = setInterval(() => {
      intentos++;

      let map: L.Map | null = null;
      try {
        map = this.mapService.getMap();
      } catch {}

      if (map) {
        clearInterval(timer);
        this.mapService.setDistritoBoundaries(ubigeos);
        return;
      }

      if (intentos >= maxIntentos) {
        clearInterval(timer);
        console.warn('No se pudo pintar límites: mapa no inicializado a tiempo');
      }
    }, 100);
  }

  private centrarPrimerDistritoCuandoMapaEsteListo(codigoUbigeo: string): void {
    let intentos = 0;
    const maxIntentos = 30;

    const timer = setInterval(() => {
      intentos++;

      let map: L.Map | null = null;
      try {
        map = this.mapService.getMap();
      } catch {}

      if (map) {
        clearInterval(timer);
        this.centrarYMarcarDistrito(codigoUbigeo);
        return;
      }

      if (intentos >= maxIntentos) {
        clearInterval(timer);
        console.warn('No se pudo centrar distrito: mapa no inicializado a tiempo');
      }
    }, 100);
  }

  private centrarYMarcarDistrito(codigoUbigeo: string): void {
    this.distritoCoords.obtenerGeometria(codigoUbigeo).subscribe({
      next: (resp) => {
        if (!resp?.success || !resp.data) return;

        const geoString = (resp.data as any).geojson ?? (resp.data as any).geoson;
        if (!geoString) return;

        const geo = typeof geoString === 'string' ? JSON.parse(geoString) : geoString;

        const tmp = L.geoJSON(geo);
        const bounds = tmp.getBounds();

        const map = this.mapService.getMap();
        map.fitBounds(bounds, { padding: [24, 24] });

        // Si luego quieres el círculo aquí, lo activamos con L.circle (metros)
      },
      error: (e) => console.error('Error centrando distrito:', e),
    });
  }

  private cargar(nombre: string, page: number): void {
    this.loading = true;
    const LIMIT_TODOS = 9999;

    this.distritos.buscar(nombre, page, LIMIT_TODOS).subscribe({
      next: (res) => {
        const orgs: Distrito[] = res?.data?.organizaciones ?? [];
        this.items = [...orgs].sort((a, b) => (a.distrito ?? '').localeCompare(b.distrito ?? ''));
        if (nombre === '') {
          this.fullListDistritos = [...this.items];
          this.ui.setAllDistritos(this.fullListDistritos);
        }
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.loading = false;
      },
    });
  }
}
