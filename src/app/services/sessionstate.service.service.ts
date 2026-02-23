import {Injectable} from '@angular/core';
import {AppFlowStep} from '../enums/AppFlowStep';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionstateServiceService {

  private readonly step$ = new BehaviorSubject<AppFlowStep>(AppFlowStep.LOGIN);
  currentStep$ = this.step$.asObservable();

  setLogin() {
    this.step$.next(AppFlowStep.LOGIN);
  }

  setBuscador() {
    this.step$.next(AppFlowStep.BUSCADOR);
  }

  setDashboard() {
    this.step$.next(AppFlowStep.DASHBOARD);
  }

  reset() {
    this.step$.next(AppFlowStep.LOGIN);
  }

  get current(): AppFlowStep {
    return this.step$.value;
  }
}
