import { Component } from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {SidebarComponent} from '../sidebar/sidebar.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone : true,
  imports: [SidebarComponent, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  doLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }


}
