import {Component, EventEmitter, inject, Output} from '@angular/core';
import { CommonModule } from '@angular/common'; // Para el pipe | async
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button'; // Para mat-button
import { RouterModule } from '@angular/router'; // Para routerLink
import { UiStateService} from '../../../services/ui-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  @Output() logout = new EventEmitter<void>();
  //protected uiService: UiStateService;

  public uiService = inject(UiStateService);

  abrirEstadisticas() {
    // Ahora 'this.uiService' sí será reconocido
    this.uiService.toggleStatsWidget();
  }

}
