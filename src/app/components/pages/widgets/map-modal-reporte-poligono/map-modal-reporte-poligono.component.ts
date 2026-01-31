import { Component, inject, AfterViewInit, ElementRef, ViewChild, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService } from '../../../../services/ui-state.service';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import { UbigeoComponent } from '../../../shared/ubigeo/ubigeo.component';
import { DistritoSelected} from '../../../../interfaces/DistritoSelected';

Chart.register(...registerables);

@Component({
  selector: 'app-map-modal-reporte-poligono',
  standalone: true,
  imports: [CommonModule, MatIconModule, UbigeoComponent],
  templateUrl: './map-modal-reporte-poligono.component.html',
  styleUrl: './map-modal-reporte-poligono.component.css'
})
export class MapModalReportePoligonoComponent implements AfterViewInit {
  public uiService = inject(UiStateService);
  isMaximized = signal(true);

  // Fuente de verdad desde el Service (Signal)
  distritosSeleccionados = this.uiService.distritosSeleccionados;

  // Referencias a los 4 lienzos de los gráficos
  @ViewChild('chart1') chart1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart2') chart2!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart3') chart3!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart4') chart4!: ElementRef<HTMLCanvasElement>;

  constructor() {
    // Redibujar automáticamente cuando cambie la lista de distritos
    effect(() => {
      if (this.distritosSeleccionados().length >= 0) {
        setTimeout(() => this.renderAllCharts(), 50);
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.renderAllCharts(), 150);
  }

  toggleSize() {
    this.isMaximized.set(!this.isMaximized());
    setTimeout(() => this.renderAllCharts(), 300);
  }

  private renderAllCharts() {
    // Validar que existan los elementos en el DOM
    if (!this.chart1?.nativeElement) return;

    this.initBar(this.chart1, [80, 0, 43, 24, 57, 0], ['QA1', 'QA2', 'CIC', 'QA3', 'QA4', 'Muni'], '#3B82F6');
    this.initBar(this.chart2, [230, 0, 125, 69, 165, 0], ['QA1', 'QA2', 'CIC', 'QA3', 'QA4', 'Muni'], '#D4AF37');

    // Gráfico 3: Usa los distritos reales de la Signal
    const labelsDistritos = this.distritosSeleccionados().map(d => d.distrito || 'Sin nombre');
    this.initStacked(this.chart3, labelsDistritos);

    // Gráfico 4: Lotes (labels fijos por ahora)
    this.initStacked(this.chart4, ['Lote 1', 'Lote 2', 'Lote 3', 'Lote 4', 'Lote 5']);
  }

  private initBar(ref: ElementRef<HTMLCanvasElement>, data: number[], labels: string[], color: string) {
    const canvas = ref.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

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
    const canvas = ref.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'QA 1', data: labels.map(() => Math.floor(Math.random() * 20)), backgroundColor: '#1E3A8A' },
          { label: 'QA 2', data: labels.map(() => Math.floor(Math.random() * 15)), backgroundColor: '#F97316' },
          { label: 'CIC',  data: labels.map(() => Math.floor(Math.random() * 10)), backgroundColor: '#94A3B8' },
          { label: 'QA 3', data: labels.map(() => Math.floor(Math.random() * 18)), backgroundColor: '#FACC15' },
          { label: 'QA 4', data: labels.map(() => Math.floor(Math.random() * 12)), backgroundColor: '#4ADE80' },
          { label: 'MUNI', data: labels.map(() => Math.floor(Math.random() * 10)), backgroundColor: '#EF4444' }
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

  onDistritoSeleccionado(event: { ubigeo: string; distrito: string }) {
    this.uiService.addDistritos({
      codigoUbigeo: event.ubigeo,
      distrito: event.distrito,
      idOrganizacion: Date.now(),
      provincia: '',
      departamento: '',
      nombreOrganizacion: ''
    } as DistritoSelected);
  }

  quitarDistrito(codigo: string) {
    this.uiService.removeDistritos(codigo);
  }
}
