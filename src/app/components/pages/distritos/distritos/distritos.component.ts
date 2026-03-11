import { Component, OnInit, inject,OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DistritosService } from '../../../../services/distritos.service';
import { Router } from '@angular/router';
import { Distrito } from '../../../../interfaces/Distrito';
import { DistritoSelected } from '../../../../interfaces/DistritoSelected';
import { UiStateService } from '../../../../services/ui-state.service';
import { MapaComponent } from '../../mapa/mapa.component';
import { ControlCapasComponent } from '../../control-capas/control-capas.component';
import { MatIconModule } from '@angular/material/icon';
import { MapModalReporteMapaComponent } from '../../widgets/map-modal-reporte-mapa/map-modal-reporte-mapa.component';
import { MapService } from '../../../../services/map.service';
import { DistritocoordenadasService } from '../../../../services/distritocoordenadas.service';
import * as L from 'leaflet';
import { extractDistritoGeoJson, fitGeoBounds } from '../../../../utils/distrito-geo.utils';
import { LoteSelectorComponent } from '../../../shared/lote-selector/lote-selector.component';
import { LoteService } from '../../../../services/lote.service';
import { Subscription } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu'; 

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MapaComponent,
    ControlCapasComponent,
    MapModalReporteMapaComponent,
    MatIconModule,
    LoteSelectorComponent,
    MatMenuModule
  ],
  templateUrl: './distritos.component.html',
  styleUrls: ['./distritos.component.css'],
})
export class DistritosComponent implements OnInit, OnDestroy {

  public uiService = inject(UiStateService);

  search = new FormControl('');
  /** Lista que se muestra en la grilla (puede estar filtrada por búsqueda). */
  items: Distrito[] = [];
  /** Lista completa de distritos del usuario (solo se actualiza al cargar sin filtro, para Reporte Espacial). */
  private fullListDistritos: Distrito[] = [];
  loading = false;

  /** Cuando hay lotes seleccionados, solo se muestran distritos cuyo ubigeo está en este set. Si es null, se muestran todos. */
  private filterUbigeosByLote: Set<string> | null = null;

  private readonly selectedMap = new Map<number, Distrito>();
  private distritosSub?: Subscription;

  constructor(
    private readonly distritos: DistritosService,
    private readonly router: Router,
    public ui: UiStateService,
    private readonly mapService: MapService,
    private readonly distritoCoords: DistritocoordenadasService,
    private readonly loteService: LoteService
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
    this.distritosSub = this.ui.distritos$.subscribe((list) => this.syncSelectedMapFromService(list));
  }

  ngOnDestroy(): void {
    this.distritosSub?.unsubscribe();
  }

  /** Sincroniza la grilla (selectedMap) con el estado del servicio (p. ej. cuando se limpia desde el dashboard). */
  private syncSelectedMapFromService(list: { codigoUbigeo?: string | null; idOrganizacion?: number }[]): void {
    this.selectedMap.clear();
    const arr = list ?? [];
    arr.forEach((d) => {
      const item = this.items.find((i) => (i.codigoUbigeo ?? '') === (d.codigoUbigeo ?? ''));
      if (item) this.selectedMap.set(item.idOrganizacion, item);
    });
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

  /** Lista que se muestra en la grilla: si hay filtro por lotes, solo distritos de esos lotes; si no, todos los items. */
  get itemsToDisplay(): Distrito[] {
    if (!this.filterUbigeosByLote) return this.items;
    return this.items.filter((d) => this.filterUbigeosByLote!.has(d.codigoUbigeo ?? ''));
  }

  /** Ubigeos de la lista completa (para el selector de lote). Usa fullListDistritos si está cargada. */
  get allUbigeosForLote(): string[] {
    const list = this.fullListDistritos.length > 0 ? this.fullListDistritos : this.items;
    return list.map((d) => d.codigoUbigeo).filter((u): u is string => !!u);
  }

  get todosSeleccionados(): boolean {
    const list = this.itemsToDisplay;
    return list.length > 0 && list.every((d) => this.selectedMap.has(d.idOrganizacion));
  }

  /** Si hay filtro por lotes activo, lo reinicia (INICIO: al usar "Seleccionar todos" / "Deseleccionar todos"). */
  private resetLoteFilterIfActive(): void {
    if (this.filterUbigeosByLote === null) return;
    this.filterUbigeosByLote = null;
    this.ui.setSelectedLoteCodigos([]);
  }

  seleccionarTodos(): void {
    this.resetLoteFilterIfActive();
    this.itemsToDisplay.forEach((d) => this.selectedMap.set(d.idOrganizacion, d));
  }

  deseleccionarTodos(): void {
    this.resetLoteFilterIfActive();
    this.itemsToDisplay.forEach((d) => this.selectedMap.delete(d.idOrganizacion));
  }

  /** Selecciona en la grilla todos los distritos que pertenecen al lote (ubigeos). Filtra la grilla para mostrar solo esos distritos y actualiza el servicio en silencio. */
  onLoteChange(ubigeos: string[]): void {
    if (ubigeos.length === 0) {
      this.filterUbigeosByLote = null;
      this.selectedMap.clear();
      this.ui.setDistritos([], { silent: true });
      return;
    }
    this.filterUbigeosByLote = new Set(ubigeos);
    const set = new Set(ubigeos);
    const sourceList = this.fullListDistritos.length > 0 ? this.fullListDistritos : this.items;
    const selected = sourceList.filter((d) => set.has(d.codigoUbigeo ?? ''));
    this.selectedMap.clear();
    selected.forEach((d) => this.selectedMap.set(d.idOrganizacion, d));
    this.ui.setDistritos(selected as DistritoSelected[], { silent: true });
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
    this.executeWhenMapReady(
      () => this.mapService.setDistritoBoundaries(ubigeos),
      'No se pudo pintar límites: mapa no inicializado a tiempo'
    );
  }

  private centrarPrimerDistritoCuandoMapaEsteListo(codigoUbigeo: string): void {
    this.executeWhenMapReady(
      () => this.centrarYMarcarDistrito(codigoUbigeo),
      'No se pudo centrar distrito: mapa no inicializado a tiempo'
    );
  }

  private centrarYMarcarDistrito(codigoUbigeo: string): void {
    this.distritoCoords.obtenerGeometria(codigoUbigeo).subscribe({
      next: (resp) => {
        if (!resp?.success || !resp.data) return;

        const geo = extractDistritoGeoJson(resp.data);
        if (!geo) return;
        const map = this.mapService.getMap();
        fitGeoBounds(map, geo);

        // Si luego quieres el círculo aquí, lo activamos con L.circle (metros)
      },
      error: (e) => console.error('Error centrando distrito:', e),
    });
  }

  private executeWhenMapReady(action: () => void, timeoutMessage: string): void {
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
        action();
        return;
      }

      if (intentos >= maxIntentos) {
        clearInterval(timer);
        console.warn(timeoutMessage);
      }
    }, 100);
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
        this.syncSelectedMapFromService(this.ui.distritosSeleccionados());
        this.applyLoteFilterWhenLoaded();
      },
      error: () => {
        this.items = [];
        this.loading = false;
      },
    });
  }

  /** Si hay lotes seleccionados, aplica el filtro de grilla (solo distritos de esos lotes) tras cargar la lista. */
  private applyLoteFilterWhenLoaded(): void {
    const codigos = this.ui.selectedLoteCodigos();
    if (codigos.length === 0) {
      this.filterUbigeosByLote = null;
      return;
    }
    const allUbigeos = this.fullListDistritos.length > 0
      ? this.fullListDistritos.map((d) => d.codigoUbigeo).filter((u): u is string => !!u)
      : this.items.map((d) => d.codigoUbigeo).filter((u): u is string => !!u);
    if (!allUbigeos.length) return;
    this.loteService.getUbigeosByLotes(codigos, allUbigeos).subscribe((ubigeos) => {
      this.filterUbigeosByLote = new Set(ubigeos);
    });
  }
   cambiarMapa(tipo:string){
    this.uiService.setBaseMapa(tipo);
  }
}
