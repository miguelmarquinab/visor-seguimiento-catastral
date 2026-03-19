import { Component, EventEmitter, inject, Output,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { UiStateService } from '../../../services/ui-state.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule, MatTooltipModule, MatMenuModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  @Output() logout = new EventEmitter<void>();
  version : string = '';
  public uiService = inject(UiStateService);

  ngOnInit(): void {
    this.version = `${environment.version} ${environment.ambiente}`;
  }
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
