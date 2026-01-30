import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DistritoSelected } from '../interfaces/DistritoSelected';
import {Distrito} from '../interfaces/Distrito';

type ViewMode = 'distritos' | 'mapa';

@Injectable({ providedIn: 'root' })
export class UiStateService {

  private readonly LS_KEY = 'distritos_seleccionados';

  private viewSubject = new BehaviorSubject<ViewMode>('distritos');
  view$ = this.viewSubject.asObservable();

  private distritosSubject = new BehaviorSubject<DistritoSelected[]>(this.readFromLocalStorage());
  distritos$ = this.distritosSubject.asObservable();

  private _showControl = new BehaviorSubject<boolean>(true);
  showControl$ = this._showControl.asObservable();

  private _showStatsWidget = new BehaviorSubject<boolean>(false);
  showStatsWidget$ = this._showStatsWidget.asObservable();

  private categorySelectedSubject = new BehaviorSubject<string | null>(null);
  categorySelected$ = this.categorySelectedSubject.asObservable();

  private _showManzanaPanel = new BehaviorSubject<boolean>(false);
  showManzanaPanel$ = this._showManzanaPanel.asObservable();

  private _showPoligonoPanel = new BehaviorSubject<boolean>(false);
  showPoligonoPanel$ = this._showPoligonoPanel.asObservable();

  constructor() {
    const saved = localStorage.getItem(this.LS_KEY);
    if (saved) {
      try {
        const distritos = JSON.parse(saved) as Distrito[];
        this.distritosSubject.next(distritos ?? []);
      } catch {
        localStorage.removeItem(this.LS_KEY);
      }
    }
    this.viewSubject.next('distritos');
  }

  setShowControl(v: boolean) { this._showControl.next(v); }

  toggleControl() { this._showControl.next(!this._showControl.value); }

  setView(view: ViewMode) { this.viewSubject.next(view);}

  setDistritos(selected: DistritoSelected[]) {
    this.distritosSubject.next(selected);
    localStorage.setItem(this.LS_KEY, JSON.stringify(selected));
    this.viewSubject.next((selected?.length ?? 0) > 0 ? 'mapa' : 'distritos');
  }

  toggleStatsWidget() { this._showStatsWidget.next(!this._showStatsWidget.value);}

  selectCategory(label : string | null) {
    this.categorySelectedSubject.next(label);
  }

  toggleManzanaPanel() {
    this._showManzanaPanel.next(!this._showManzanaPanel.value);
  }

  togglePoligoPanel() {
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
}
