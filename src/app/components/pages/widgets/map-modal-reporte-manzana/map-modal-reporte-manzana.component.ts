import { Component, inject, AfterViewInit, ElementRef, ViewChild, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService } from '../../../../services/ui-state.service';
import { Chart, registerables } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UbigeoComponent } from '../../../shared/ubigeo/ubigeo.component';
import { DistritoSelected } from '../../../../interfaces/DistritoSelected';

Chart.register(...registerables);

@Component({
  selector: 'app-map-modal-reporte-manzana',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, UbigeoComponent],
  templateUrl: './map-modal-reporte-manzana.component.html',
  styleUrl: './map-modal-reporte-manzana.component.css'
})
export class MapModalReporteManzanaComponent implements AfterViewInit {
  private uiService = inject(UiStateService);

  // 1. Conexión a la fuente de verdad (Signal del Servicio)
  // Esto hace que si seleccionas distritos en la búsqueda inicial, aparezcan aquí.
  distritosSeleccionados = this.uiService.distritosSeleccionados;

  isMaximized = signal(true);

  @ViewChild('barChart') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stackedChart') stackedChartCanvas!: ElementRef<HTMLCanvasElement>;

  summaryCards = [
    { label: 'Total de Manzanas', value: 500, class: 'total' },
    { label: 'Pendiente', value: 78, class: 'pendiente' },
    { label: 'Levantamiento', value: 50, class: 'levantamiento' },
    { label: 'Edición gráfica', value: 99, class: 'edicion' },
    { label: 'Control de calidad Int', value: 50, class: 'calidad' },
    { label: 'Terminada', value: 100, class: 'terminada' },
    { label: 'En polígono', value: 123, class: 'poligono' }
  ];

  constructor() {
    // 2. Efecto reactivo: Cada vez que los distritos cambian en el servicio,
    // redibujamos el gráfico apilado.
    effect(() => {
      const data = this.distritosSeleccionados();
      if (data.length >= 0) {
        // Un pequeño delay para esperar a que el DOM se ajuste si es necesario
        setTimeout(() => this.renderCharts(), 50);
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.renderCharts(), 150);
  }

  toggleSise(): void {
    this.isMaximized.set(!this.isMaximized());
    setTimeout(() => this.renderCharts(), 300);
  }

  private renderCharts() {
    if (this.barChartCanvas?.nativeElement && this.stackedChartCanvas?.nativeElement) {
      this.initBarChart();
      this.initStackedChart();
    }
  }

  private initBarChart() {
    const canvas = this.barChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // FIX: Mapeo seguro con encadenamiento opcional y filtrado de nulos
    const labels = this.distritosSeleccionados()
      .map(d => d?.distrito || 'Sin nombre'); // <--- Si d es null, no rompe

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Pendiente', data: labels.map(() => Math.floor(Math.random() * 20)), backgroundColor: '#f2c94c' },
          { label: 'Terminada', data: labels.map(() => Math.floor(Math.random() * 20)), backgroundColor: '#27ae60' }
        ]
      },
      options: {
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  // onDistritoSeleccionado(event: { ubigeo: string; distrito: string }) {
  //   // 4. Agregamos al servicio para que se persista en LocalStorage y se vea en otros paneles
  //   this.uiService.addDistritos({
  //     codigoUbigeo: event.ubigeo,
  //     distrito: event.distrito
  //   } as DistritoSelected);
  // }
  onDistritoSeleccionado(event: { ubigeo: string; distrito: string }) {
    // FIX: Llamar al método en SINGULAR y completar el objeto para que cumpla la interfaz
    const nuevoDistrito: Partial<DistritoSelected> = {
      codigoUbigeo: event.ubigeo,
      distrito: event.distrito,
      idOrganizacion: Date.now(), // ID temporal para evitar errores de tipo
      provincia: '',
      departamento: '',
      nombreOrganizacion: ''
    };

    this.uiService.addDistritos(nuevoDistrito as DistritoSelected);
  }

  quitarDistrito(codigo: string) {
    // FIX: Llamar al método en SINGULAR
    this.uiService.removeDistritos(codigo);
  }
}
