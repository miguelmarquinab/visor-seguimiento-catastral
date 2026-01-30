import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Distrito} from '../interfaces/Distrito';

@Injectable({
  providedIn: 'root'
})
export class ReportestateService {

  private distritosSubject = new BehaviorSubject<Distrito[]>([]);
  distritos$ = this.distritosSubject.asObservable();



  setDistritos(distritos: Distrito[]) {
    this.distritosSubject.next(distritos);
  }

  addDistrito(distrito: Distrito) {
    const actuales = this.distritosSubject.getValue();
    this.distritosSubject.next([...actuales, distrito]);
  }

  getDistritos(): Distrito[] {
    return this.distritosSubject.getValue();
  }

}
