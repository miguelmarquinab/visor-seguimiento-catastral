import { Component } from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {SidebarComponent} from '../sidebar/sidebar.component';
import { AuthService } from '../../../core/auth/auth.service';
import { UiStateService } from '../../../services/ui-state.service';

@Component({
  selector: 'app-main-layout',
  standalone : true,
  imports: [SidebarComponent, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly ui: UiStateService,
  ) {}

  doLogout(): void {
    this.auth.logout();

    this.ui.reset();
    this.router.navigateByUrl('/login');
  }
}
