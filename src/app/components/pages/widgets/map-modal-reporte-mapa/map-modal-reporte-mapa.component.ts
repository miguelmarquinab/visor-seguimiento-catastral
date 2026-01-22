import {Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Chart, registerables} from 'chart.js';
import {MatToolbarModule} from '@angular/material/toolbar';
import { UiStateService} from '../../../../services/ui-state.service';

Chart.register(...registerables);

@Component({
  selector: 'app-map-modal-reporte-mapa',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
  ],
  templateUrl: './map-modal-reporte-mapa.component.html',
  styleUrl: './map-modal-reporte-mapa.component.css'
})
export class MapModalReporteMapaComponent implements AfterViewInit {

  @ViewChild('statsChart', { static: false }) statsChart!: ElementRef<HTMLCanvasElement>;
  private uiService = inject(UiStateService);

  //Data Hardcoded segun prototipo
  dataEstadistica = [
    { label: 'Pendiente', valor: 10.2, color: '#F7E33F' },
    { label: 'Levantamiento', valor: 15.5, color: '#3182DE' },
    { label: 'Edición gráfica', valor: 15.0, color: '#A53FF7' },
    { label: 'Control de calidad interno', valor: 13.5, color: '#F7931E' },
    { label: 'Terminada', valor: 19.2, color: '#39BD3F' },
    { label: 'En polígono', valor: 9.6, color: '#DE3131' }
  ];

  ngAfterViewInit() {
    // Un pequeño timeout asegura que el renderizado del @if haya terminado
    setTimeout(() => {
      this.renderChart();
    }, 0);
  }

  renderChart() {
    if (!this.statsChart) return;

    const ctx = this.statsChart.nativeElement.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.dataEstadistica.map(d => d.label),
          datasets: [{
            label: 'Valor',
            data: this.dataEstadistica.map(d => d.valor),
            //backgroundColor: this.dataEstadistica.map(d => d.color),
            backgroundColor: this.dataEstadistica.map(d => {
              // Si hay una categoría seleccionada y no es esta, bajamos la opacidad
              return d.color;
            }),
            borderRadius: 5,
            borderWidth: 0,
            barThickness: 20
          }]
        },
        options: {
          onClick: (event, elements, chart) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              const label = this.dataEstadistica[index].label;

              // Enviamos la categoría seleccionada al servicio
              this.uiService.selectCategory(label);
              console.log('Filtrando mapa por:', label);
            } else {
              // Si hace clic fuera de una barra, limpiamos el filtro
              this.uiService.selectCategory(null);
            }
          },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { display: true, color: '#f0f0f0' }
            },
            x: { grid: { display: false } }
          },

        }
      });
    }
  }

  exportar(formato: string) {
    console.log('Exportando a:', formato);
  }

  cerrar() {
    this.uiService.setStatsWidget(false);
  }

}
