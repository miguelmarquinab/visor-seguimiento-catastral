import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DistritoSelected} from '../interfaces/DistritoSelected';

type ViewMode = 'distritos' | 'mapa';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {

  private readonly LS_KEY = 'distritos_seleccionados';
  private viewSubject = new BehaviorSubject<ViewMode>("distritos")
  view$ = this.viewSubject.asObservable();

  private _showControl = new BehaviorSubject<boolean>(true);
  showControl$ = this._showControl.asObservable();


  private distritosSubject = new BehaviorSubject<DistritoSelected[]>(this.readFromLocalStorage());
  distritos$ = this.distritosSubject.asObservable();

  setShowControl(v: boolean) { this._showControl.next(v); }
  toggleControl() { this._showControl.next(!this._showControl.value); }

  setView(view: ViewMode) {
    this.viewSubject.next(view);
  }

  setDistritos(selected: DistritoSelected[]) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(selected));
    this.distritosSubject.next([]);
    this.setView('distritos');
  }

  clearDistritos() {
    localStorage.removeItem(this.LS_KEY);
    this.distritosSubject.next([]);
    this.setView('distritos');
  }

  private readFromLocalStorage(): DistritoSelected[] {
    try {
      const raw = localStorage.getItem(this.LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  constructor() { }
}
