import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { UiStateService } from '../../../services/ui-state.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Output() logout = new EventEmitter<void>();

  public uiService = inject(UiStateService);

  /** Muestra pantalla de inicio (selección de distritos) */
  abrirInicio(): void {
    this.uiService.setView('distritos');
  }
  
  abrirEstadisticas() {
    this.uiService.toggleStatsWidget();
  }

  abrirReporteManzanas() {
    this.uiService.toggleManzanaPanel();
  }

  abrirReportePoligonos() {
    this.uiService.togglePoligoPanel();
  }

}
