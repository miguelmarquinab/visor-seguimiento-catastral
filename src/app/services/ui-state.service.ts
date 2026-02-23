import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DistritoSelected } from '../interfaces/DistritoSelected';
import {Distrito} from '../interfaces/Distrito';
import { ConteoEstadoItem } from '../interfaces/ManzanaConteo';
import { ConteoEstadoItem as ConteoEstadoItemPoligono} from '../interfaces/PoligonoConteo';
type ViewMode = 'distritos' | 'mapa';
type PanelActivo = 'manzana' | 'poligono' | null;

@Injectable({ providedIn: 'root' })
export class UiStateService {

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

  /** Guarda el listado completo de distritos permitidos para el usuario logado. */
  setAllDistritos(list: DistritoSelected[]): void {
    this.allDistritosSubject.next(list ?? []);
  }

  setDistritos(selected: DistritoSelected[]) {
    this._distritosSig.set(selected);
    // 1. Actualizar Signal (para reportes nuevos)
    this.distritosSubject.next(selected);
    // 2. Actualizar Observable (para componentes antiguos)
    localStorage.setItem(this.LS_KEY, JSON.stringify(selected));
    // 3. Persistir
    this.viewSubject.next((selected?.length ?? 0) > 0 ? 'mapa' : 'distritos');
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

  reset(): void {
    this.viewSubject.next('distritos');
    this.distritosSubject.next([]);
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
}
