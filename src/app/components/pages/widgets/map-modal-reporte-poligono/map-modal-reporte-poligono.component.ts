import { Component, inject, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService } from '../../../../services/ui-state.service';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-map-modal-reporte-poligono',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './map-modal-reporte-poligono.component.html',
  styleUrl: './map-modal-reporte-poligono.component.css'
})
export class MapModalReportePoligonoComponent implements AfterViewInit {
  public uiService = inject(UiStateService);
  isMaximized = signal(true);

  // Referencias a los 4 lienzos de los gráficos
  @ViewChild('chart1') chart1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart2') chart2!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart3') chart3!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart4') chart4!: ElementRef<HTMLCanvasElement>;

  distritosSeleccionados = ['INDEPENDENCIA', 'EL AGUSTINO', 'BREÑA', 'SAN LUIS'];

  ngAfterViewInit() {
    this.renderAllCharts();
  }

  toggleSize() {
    this.isMaximized.set(!this.isMaximized());
    if (this.isMaximized()) {
      // Pequeño delay para asegurar que el DOM se renderice antes de dibujar
      setTimeout(() => this.renderAllCharts(), 100);
    }
  }

  private renderAllCharts() {
    // Gráfico 1: Barras Simples (Azul)
    this.initBar(this.chart1, [80, 0, 43, 24, 57, 0], ['QA1', 'QA2', 'CIC', 'QA3', 'QA4', 'Muni'], '#3B82F6');

    // Gráfico 2: Barras Simples (Dorado)
    this.initBar(this.chart2, [230, 0, 125, 69, 165, 0], ['QA1', 'QA2', 'CIC', 'QA3', 'QA4', 'Muni'], '#D4AF37');

    // Gráfico 3: Apilado por Distrito
    this.initStacked(this.chart3, ['Independencia', 'El Agustino', 'Breña', 'San Luis']);

    // Gráfico 4: Apilado por Lote
    this.initStacked(this.chart4, ['Lote 1', 'Lote 2', 'Lote 3', 'Lote 4', 'Lote 5']);
  }

  private initBar(ref: ElementRef<HTMLCanvasElement>, data: number[], labels: string[], color: string) {
    const ctx = ref.nativeElement.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: color, borderRadius: 4 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  private initStacked(ref: ElementRef<HTMLCanvasElement>, labels: string[]) {
    const ctx = ref.nativeElement.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'QA 1', data: [13, 10, 21, 8, 15], backgroundColor: '#1E3A8A' },
          { label: 'QA 2', data: [11, 8, 7, 8, 10], backgroundColor: '#F97316' },
          { label: 'CIC', data: [10, 14, 10, 10, 5], backgroundColor: '#94A3B8' },
          { label: 'QA 3', data: [13, 14, 7, 20, 12], backgroundColor: '#FACC15' },
          { label: 'QA 4', data: [15, 14, 10, 9, 8], backgroundColor: '#4ADE80' },
          { label: 'MUNI', data: [12, 10, 13, 15, 7], backgroundColor: '#EF4444' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true } },
        plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } }
      }
    });
  }
}
