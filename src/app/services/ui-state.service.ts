import { Injectable, signal, computed, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DistritoSelected } from '../interfaces/DistritoSelected';
import {Distrito} from '../interfaces/Distrito';
import { ConteoEstadoItem } from '../interfaces/ManzanaConteo';
import { ConteoEstadoItem as ConteoEstadoItemPoligono} from '../interfaces/PoligonoConteo';
import { LoteService } from './lote.service';
import { ModoFiltro } from '../enums/ModoFiltro';
type ViewMode = 'distritos' | 'mapa';
type PanelActivo = 'manzana' | 'poligono' | null;

@Injectable({ providedIn: 'root' })
export class UiStateService {

  private readonly loteService = inject(LoteService);
  private readonly LS_KEY = 'distritos_seleccionados';

  private readonly viewSubject = new BehaviorSubject<ViewMode>('distritos');
  view$ = this.viewSubject.asObservable();

  private readonly distritosSubject = new BehaviorSubject<DistritoSelected[]>(this.readFromLocalStorage());
  distritos$ = this.distritosSubject.asObservable();

  private readonly _distritosSig = signal<DistritoSelected[]>(this.readFromLocalStorage());
  distritosSeleccionados = computed(() => this._distritosSig());

  /** Listado completo de distritos cargado tras el login (permitidos para el usuario logado) */
  private readonly allDistritosSubject = new BehaviorSubject<DistritoSelected[]>([]);
  allDistritos$ = this.allDistritosSubject.asObservable();

  /** Códigos de lotes seleccionados en el filtro (multi-select, persistente). */
  readonly selectedLoteCodigos = signal<string[]>(this.readLotesFromStorage());

  setSelectedLoteCodigos(codigos: string[]): void {
    const value = Array.isArray(codigos) ? codigos.filter((c) => c != null && c !== '') : [];
    this.selectedLoteCodigos.set(value);
    try {
      localStorage.setItem('lotes_seleccionados', JSON.stringify(value));
    } catch {}
  }

  private readonly _showControl = new BehaviorSubject<boolean>(true);
  showControl$ = this._showControl.asObservable();

  private readonly _showStatsWidget = new BehaviorSubject<boolean>(false);
  showStatsWidget$ = this._showStatsWidget.asObservable();

  private readonly categorySelectedSubject = new BehaviorSubject<string | null>(null);
  categorySelected$ = this.categorySelectedSubject.asObservable();

  private readonly _showManzanaPanel = new BehaviorSubject<boolean>(false);
  showManzanaPanel$ = this._showManzanaPanel.asObservable();

  private readonly _showPoligonoPanel = new BehaviorSubject<boolean>(false);
  showPoligonoPanel$ = this._showPoligonoPanel.asObservable();

  private readonly _datosConteoManzanas = signal<ConteoEstadoItem[]>([]);
  datosConteoManzanas = computed(() => this._datosConteoManzanas());

  private readonly _datosConteoPoligonos = signal<ConteoEstadoItemPoligono[]>([]);
  datosConteoPoligonos = computed(() => this._datosConteoPoligonos());
  constructor() {
    const saved = localStorage.getItem(this.LS_KEY);
    if (saved) {
      try {
        const distritos = JSON.parse(saved) as Distrito[];
        this.distritosSubject.next(distritos ?? []);
        this._distritosSig.set(distritos); // <--- ¡Añade esto para que la Signal inicie con datos!
      } catch {
        localStorage.removeItem(this.LS_KEY);
      }
    }
    this.viewSubject.next('distritos');
  }

  setShowControl(v: boolean) { this._showControl.next(v); }

  toggleControl() { this._showControl.next(!this._showControl.value); }

  /** Guarda el listado completo de distritos permitidos para el usuario logado. Si hay lotes seleccionados, aplica su filtro a distritos (sin cambiar la vista). */
  setAllDistritos(list: DistritoSelected[]): void {
    const fullList = list ?? [];
    this.allDistritosSubject.next(fullList);
    const codigos = this.selectedLoteCodigos();
    if (codigos.length === 0 || fullList.length === 0) return;
    const allUbigeos = fullList.map((d) => d.codigoUbigeo).filter((u): u is string => !!u);
    const expected = this.loteService.getUbigeosByLotesSync(codigos, allUbigeos);
    if (expected !== null) {
      const set = new Set(expected);
      const filtered = fullList.filter((d) => set.has(d.codigoUbigeo ?? ''));
      this.setDistritosSilent(filtered);
      return;
    }
    this.loteService.getUbigeosByLotes(codigos, allUbigeos).subscribe((ubigeos) => {
      const set = new Set(ubigeos);
      const filtered = fullList.filter((d) => set.has(d.codigoUbigeo ?? ''));
      this.setDistritosSilent(filtered);
    });
  }

  setDistritos(selected: DistritoSelected[], options?: { silent?: boolean }) {
    const list = selected ?? [];
    const unicos = this.dedupDistritosPorUbigeo(list);
    this._distritosSig.set(unicos);
    this.distritosSubject.next(unicos);
    localStorage.setItem(this.LS_KEY, JSON.stringify(unicos));
    if (options?.silent) return;
    // Solo ir a mapa cuando hay distritos. Si se vacía (ej. "Seleccionar Lote" en dashboard), no redirigir a inicio.
    if (unicos.length > 0) {
      this.viewSubject.next('mapa');
    }
    this.clearLoteIfSelectionMismatch();
  }

  /** Actualiza distritos sin cambiar la vista (para aplicar lotes guardados al cargar allDistritos). */
  private setDistritosSilent(selected: DistritoSelected[]): void {
    const list = selected ?? [];
    const unicos = this.dedupDistritosPorUbigeo(list);
    this._distritosSig.set(unicos);
    this.distritosSubject.next(unicos);
    localStorage.setItem(this.LS_KEY, JSON.stringify(unicos));
    // no viewSubject ni clearLoteIfSelectionMismatch
  }

  /** Si hay lotes seleccionados y la selección actual ya no coincide con esos lotes, vuelve a vaciar lotes. */
  private clearLoteIfSelectionMismatch(): void {
    const codigos = this.selectedLoteCodigos();
    if (!codigos.length) return;

    const currentUbigeos = new Set(
      this._distritosSig().map((d) => d.codigoUbigeo).filter((u): u is string => !!u)
    );

    const allForSinLote = this.allDistritosSubject.value.map((d) => d.codigoUbigeo).filter((u): u is string => !!u);

    const checkAndClear = (expected: string[]): void => {
      const expectedSet = new Set(expected);
      const sameSize = currentUbigeos.size === expectedSet.size;
      const sameContent = sameSize && [...currentUbigeos].every((u) => expectedSet.has(u));
      if (!sameContent) {
        this.setSelectedLoteCodigos([]);
      }
    };

    const expected = this.loteService.getUbigeosByLotesSync(codigos, allForSinLote);
    if (expected !== null) {
      checkAndClear(expected);
      return;
    }
    this.loteService.getUbigeosByLotes(codigos, allForSinLote).subscribe((exp) => {
      checkAndClear(exp);
    });
  }

  /** Una sola lista por codigoUbigeo para evitar duplicados entre Reporte Espacial, Manzanas y Polígonos. */
  private dedupDistritosPorUbigeo(list: DistritoSelected[]): DistritoSelected[] {
    const seen = new Set<string>();
    return list.filter((d) => {
      const ubigeo = d?.codigoUbigeo ?? '';
      if (seen.has(ubigeo)) return false;
      seen.add(ubigeo);
      return true;
    });
  }

  // NUEVO: Agregar desde el UbigeoSelector
  addDistritos(d: DistritoSelected) {
    const actual = this._distritosSig();
    //Evitar duplicados por codigo de ubigeo
    if(!actual.some(x=> x.codigoUbigeo === d.codigoUbigeo)) {
      this.setDistritos([...actual, d]);
    }
  }

  //Quitar desde los chips
  removeDistritos(codigoUbigeo: string): void {
    const nuevo = this._distritosSig().filter(x => x.codigoUbigeo !== codigoUbigeo);
    this.setSelectedLoteCodigos([]);
    this.setDistritos(nuevo);
  }



  setView(view: ViewMode) { this.viewSubject.next(view);}

  setShowStatsWidget(value: boolean): void {
    this._showStatsWidget.next(value);
  }

  toggleStatsWidget() {
    this._showPoligonoPanel.next(false);
    this._showManzanaPanel.next(false);
    this._showStatsWidget.next(!this._showStatsWidget.value);
  }

  //Cierra panel de Manzanas
  setShowManzanaPanel(value: boolean): void {
    this._showManzanaPanel.next(value);
  }

  //Cierra panel de Poligonos
  setShowPoligonoPanel(value: boolean): void {
    this._showPoligonoPanel.next(value);
  }

  selectCategory(label : string | null) {
    this.categorySelectedSubject.next(label);
  }

  /** Abre/cierra el panel de manzanas; al abrirlo cierra el de polígonos para que solo uno esté visible. */
  toggleManzanaPanel() {
    this._showPoligonoPanel.next(false);
    this._showStatsWidget.next(this._showManzanaPanel.value);
    this._showManzanaPanel.next(!this._showManzanaPanel.value);
  }

  /** Abre/cierra el panel de polígonos; al abrirlo cierra el de manzanas para que solo uno esté visible. */
  togglePoligoPanel() {
    this._showManzanaPanel.next(false);
    this._showStatsWidget.next(this._showPoligonoPanel.value);
    this._showPoligonoPanel.next(!this._showPoligonoPanel.value);
  }

  private readFromLocalStorage(): DistritoSelected[] {
    try {
      const raw = localStorage.getItem(this.LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private readLotesFromStorage(): string[] {
    try {
      const raw = localStorage.getItem('lotes_seleccionados');
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
      const legacy = localStorage.getItem('lote_seleccionado');
      if (legacy != null && legacy !== '') return [legacy];
      return [];
    } catch {
      return [];
    }
  }

  reset(): void {
    this.viewSubject.next('distritos');
    this.distritosSubject.next([]);
    this.setSelectedLoteCodigos([]);
    localStorage.removeItem(this.LS_KEY);
  }

  updateConteoManzanas(data: ConteoEstadoItem[]) {
    this._datosConteoManzanas.set(data);
  }
  updateConteoPoligonos(data: ConteoEstadoItemPoligono[]) {
    this._datosConteoPoligonos.set(data);
  }

  private readonly _estadosManzana = signal<string[]>(['01','02','03','04','05','06']);
  estadosManzana = this._estadosManzana.asReadonly();

  setEstadosManzana(estados: string[]) {
    this._estadosManzana.set(estados);
  }

  private readonly _estadosPoligono = signal<string[]>(['CIC', 'QA1', 'QA4', 'QA3', 'MUNI', 'QA2']);
  estadosPoligono = this._estadosPoligono.asReadonly();

  setEstadosPoligono(estados: string[]) {
    this._estadosPoligono.set(estados);
  }

  private readonly _panelActivo = signal<PanelActivo>('manzana');
  panelActivo = this._panelActivo.asReadonly();

  setPanelActivo(p: PanelActivo){
    this._panelActivo.set(p);
  }
  
  private readonly _drawPolygon = signal(false);
  drawPolygon$ = this._drawPolygon.asReadonly();

  setDrawPolygon(active: boolean) {
    this._drawPolygon.set(active);
  }

  private readonly _baseMapa = signal<string>('Satelital'); // ✔ BIEN

  readonly baseMapa$ = this._baseMapa.asReadonly();

  setBaseMapa(tipo:string){
    this._baseMapa.set(tipo);
  }

  private readonly _modoFiltro = signal<ModoFiltro>(ModoFiltro.PANTALLA);
  modoFiltro$ = this._modoFiltro.asReadonly();

  setModoFiltro(modo: ModoFiltro) {
    this._modoFiltro.set(modo);
  }

  mensajeDibujo$ = computed(() => {
    switch (this._modoFiltro()) {
      case ModoFiltro.DIBUJANDO:
        return 'Dibujando área';
      case ModoFiltro.AREA:
        return 'Filtrado por Área de dibujo';
      default:
        return 'Filtrado por Área de pantalla';
    }
  });


  private readonly filtroGeometrico = signal<any>(null);
  setFiltroGeometrico(data: any) {
    this.filtroGeometrico.set(data);
  }

  getFiltroGeometrico() {
    return this.filtroGeometrico();
  }
}
