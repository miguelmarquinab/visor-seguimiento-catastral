import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {SidebarComponent} from '../sidebar/sidebar.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone : true,
  imports: [SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }


}
