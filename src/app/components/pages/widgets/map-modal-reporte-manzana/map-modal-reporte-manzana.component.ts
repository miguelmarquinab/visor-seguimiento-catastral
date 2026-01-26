import { Component, inject, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService } from '../../../../services/ui-state.service';
import { Chart, registerables } from 'chart.js';

// IMPORTANTE: Debes importar estos módulos aquí
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

Chart.register(...registerables);

@Component({
  selector: 'app-map-modal-reporte-manzana',
  standalone: true,
  // CORRECCIÓN: Si estos módulos no están aquí, <mat-icon> da error
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './map-modal-reporte-manzana.component.html',
  styleUrl: './map-modal-reporte-manzana.component.css'
})
export class MapModalReporteManzanaComponent implements AfterViewInit {
  private uiService = inject(UiStateService);
  isMaximized = signal(true);

  @ViewChild('barChart') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stackedChart') stackedChartCanvas!: ElementRef<HTMLCanvasElement>;

  distritosSeleccionados = [
    { id: '150105', nombre: 'BREÑA' },
    { id: '150112', nombre: 'EL AGUSTINO' },
    { id: '150114', nombre: 'INDEPENDENCIA' },
    { id: '150132', nombre: 'SAN LUIS' }
  ];

  /* summaryCards = [
    { label: 'Total', value: 500, color: '#4facfe' },
    { label: 'Pendiente', value: 78, color: '#f2c94c' },
    { label: 'Levantamiento', value: 50, color: '#2d9cdb' },
    { label: 'Edición', value: 99, color: '#9b51e0' },
    { label: 'Calidad', value: 50, color: '#f2994a' },
    { label: 'Terminada', value: 100, color: '#27ae60' },
    { label: 'En polígono', value: 123, color: '#eb5757' }
  ]; */
  summaryCards = [
  { label: 'Total de Manzanas', value: 500, class: 'total' },
  { label: 'Pendiente', value: 78, class: 'pendiente' },
  { label: 'Levantamiento', value: 50, class: 'levantamiento' },
  { label: 'Edición gráfica', value: 99, class: 'edicion' },
  { label: 'Control de calidad Int', value: 50, class: 'calidad' },
  { label: 'Terminada', value: 100, class: 'terminada' },
  { label: 'En polígono', value: 123, class: 'poligono' }
];


  ngAfterViewInit() {
    // Aumentamos a 150ms para asegurar que el DOM cargue totalmente
    setTimeout(() => {
      this.renderCharts();
    }, 150);
  }

  toggleSise(): void {
    this.isMaximized.set(!this.isMaximized());
    // Esperamos a que la animación CSS termine para redibujar los gráficos
    setTimeout(() => this.renderCharts(), 300);
  }

  private renderCharts() {
    // Verificación defensiva antes de acceder al canvas
    if (this.barChartCanvas?.nativeElement && this.stackedChartCanvas?.nativeElement) {
      this.initBarChart();
      this.initStackedChart();
    }
  }

  private initBarChart() {
    const canvas = this.barChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destruir gráfico anterior para evitar duplicados al maximizar/minimizar
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pendiente', 'Levantamiento', 'Edición', 'Calidad', 'Terminada', 'Polígono'],
        datasets: [{
          label: 'Manzanas',
          data: [78, 50, 99, 50, 100, 123],
          backgroundColor: ['#f2c94c', '#2d9cdb', '#9b51e0', '#f2994a', '#27ae60', '#eb5757']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  private initStackedChart() {
    const canvas = this.stackedChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.distritosSeleccionados.map(d => d.nombre),
        datasets: [
          { label: 'Pendiente', data: [13, 10, 9, 9], backgroundColor: '#f2c94c' },
          { label: 'Terminada', data: [13, 10, 10, 10], backgroundColor: '#27ae60' }
        ]
      },
      options: {
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}
