import {CanActivate, Router} from '@angular/router';
import {Injectable} from '@angular/core';
import {SessionstateServiceService} from '../services/sessionstate.service.service';
import { AppFlowStep} from '../enums/AppFlowStep';


@Injectable({ providedIn: 'root' })
export class FlowGuard implements CanActivate {

  constructor(
    private sesionState: SessionstateServiceService,
    private router: Router
  ) {}

  canActivate(): boolean {
    switch (this.sesionState.current) {
      case AppFlowStep.LOGIN:
        this.router.navigate(['/login']);
        return false;

      case AppFlowStep.BUSCADOR:
        this.router.navigate(['/distritos']);
        return false;

      case AppFlowStep.DASHBOARD:
        return true;

      default:
        this.router.navigate(['/login']);
        return false;
    }
  }
}
