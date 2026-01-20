import {Component, inject} from '@angular/core';
import { CommonModule} from '@angular/common';
import { AuthService} from '../../../core/auth/auth.service';

export type MenuAction = 'dashboard' | 'mapa' | 'reportes' | 'salir';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  private auth = inject(AuthService);

  // ✅ se pinta con async
  userName$ = this.auth.userName$;

  logout(): void {
    this.auth.logout();
    // aquí puedes navegar a /login si ya lo tienes implementado
  }

}
