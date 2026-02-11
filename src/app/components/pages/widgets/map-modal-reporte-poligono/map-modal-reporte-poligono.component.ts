import { Component, inject, AfterViewInit, ElementRef, ViewChild, signal, effect, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { switchMap, map } from 'rxjs';
import { UiStateService } from '../../../../services/ui-state.service';
import { PoligonoReporteService } from '../../../../services/poligono-reporte.service';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import { UbigeoComponent } from '../../../shared/ubigeo/ubigeo.component';
import { DistritoSelected } from '../../../../interfaces/DistritoSelected';
import type { ReportePoligonoPorLoteItem } from '../../../../interfaces/ReportePoligonoPorLote.interface';
import type { ReportePoligonoPorDistritoItem } from '../../../../interfaces/ReportePoligonoPorDistrito.interface';
import type { ReportePoligonoPorEstadoItem } from '../../../../interfaces/ReportePoligonoPorEstado.interface';
import type { ReporteUnidadCatastralPorEstadoItem } from '../../../../interfaces/ReporteUnidadCatastralPorEstado.interface';
import type { PoligonoListaEtapasItem } from '../../../../interfaces/PoligonoListaEtapas.interface';

Chart.register(...registerables);

const STACKED_LOTE_COLORS = ['#1E3A8A', '#F97316', '#94A3B8', '#FACC15', '#4ADE80', '#EF4444'];

@Component({
  selector: 'app-map-modal-reporte-poligono',
  standalone: true,
  imports: [CommonModule, MatIconModule, UbigeoComponent],
  templateUrl: './map-modal-reporte-poligono.component.html',
  styleUrl: './map-modal-reporte-poligono.component.css'
})
export class MapModalReportePoligonoComponent implements AfterViewInit {
  public uiService = inject(UiStateService);
  private poligonoReporteService = inject(PoligonoReporteService);
  isMaximized = signal(true);
  /** Panel lateral izquierdo (filtros) plegado */
  sidebarCollapsed = signal(false);

  distritosSeleccionados = this.uiService.distritosSeleccionados;

  //Lista de códigos ubigeo permitidos para el usuario logado
  allowedUbigeos = toSignal(
    this.uiService.allDistritos$.pipe(map(list => list.map(d => d.codigoUbigeo))),
    { initialValue: [] as string[] }
  );
  selectedUbigeos = computed(() => this.distritosSeleccionados().map(d => d.codigoUbigeo));

  reportePorEstadoData = toSignal(
    toObservable(this.distritosSeleccionados).pipe(
      switchMap(distritos => {
        const ubigeos = distritos.map(d => d.codigoUbigeo);
        return this.poligonoReporteService.getReportePorEstado(ubigeos);
      })
    ),
    { initialValue: null as ReportePoligonoPorEstadoItem | null }
  );

  reportePorDistritoData = toSignal(
    toObservable(this.distritosSeleccionados).pipe(
      switchMap(distritos => {
        const ubigeos = distritos.map(d => d.codigoUbigeo);
        return this.poligonoReporteService.getReportePorDistrito(ubigeos);
      })
    ),
    { initialValue: [] as ReportePoligonoPorDistritoItem[] }
  );

  reportePorLoteData = toSignal(
    toObservable(this.distritosSeleccionados).pipe(
      switchMap(distritos => {
        const ubigeos = distritos.map(d => d.codigoUbigeo);
        return this.poligonoReporteService.getReportePorLote(ubigeos);
      })
    ),
    { initialValue: [] as ReportePoligonoPorLoteItem[] }
  );

  reporteUnidadCatastralData = toSignal(
    toObservable(this.distritosSeleccionados).pipe(
      switchMap(distritos => {
        const ubigeos = distritos.map(d => d.codigoUbigeo);
        return this.poligonoReporteService.getReporteUnidadCatastralPorEstado(ubigeos);
      })
    ),
    { initialValue: null as ReporteUnidadCatastralPorEstadoItem | null }
  );

  //listar etapas para la tabla de polígonos.
  listarEtapasData = toSignal(
    toObservable(this.distritosSeleccionados).pipe(
      switchMap(distritos => {
        const ubigeos = distritos.map(d => d.codigoUbigeo);
        return this.poligonoReporteService.getListaEtapas(ubigeos);
      })
    ),
    { initialValue: [] as PoligonoListaEtapasItem[] }
  );

  // Referencias a los 4 lienzos de los gráficos
  @ViewChild('chart1') chart1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart2') chart2!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart3') chart3!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart4') chart4!: ElementRef<HTMLCanvasElement>;

  constructor() {
    effect(() => {
      this.distritosSeleccionados();
      this.reportePorEstadoData();
      this.reportePorLoteData();
      this.reporteUnidadCatastralData();
      setTimeout(() => this.renderAllCharts(), 50);
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

    // Gráfico 1: Total de Polígonos por estado 
    const dataEstado = this.reportePorEstadoData();
    const barLabels = ['QA1', 'QA2', 'CIC', 'QA3', 'QA4', 'Muni'];
    const barValues = dataEstado
      ? [dataEstado.q1, dataEstado.q2, dataEstado.cic, dataEstado.qa3, dataEstado.qa4, dataEstado.muni]
      : [0, 0, 0, 0, 0, 0];
    this.initBar(this.chart1, barValues, barLabels, '#3B82F6');

    // Gráfico 2: Total de Unidades Catastrales por estado
    const dataUc = this.reporteUnidadCatastralData();
    const ucValues = dataUc
      ? [dataUc.ucQa1, dataUc.ucQa2, dataUc.ucCic, dataUc.ucQa3, dataUc.ucQa4, dataUc.ucMuni]
      : [0, 0, 0, 0, 0, 0];
    this.initBar(this.chart2, ucValues, barLabels, '#D4AF37');

    // Gráfico 3: Total de Polígono por distrito
    const dataDistrito = this.reportePorDistritoData();
    this.initStackedDistrito(this.chart3, dataDistrito);

    // Gráfico 4: Total de Polígono por Lote
    const dataLote = this.reportePorLoteData();
    this.initStackedLote(this.chart4, dataLote);
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

  /** Gráfico apilado "Total de Polígono por distrito" */
  private initStackedDistrito(ref: ElementRef<HTMLCanvasElement>, data: ReportePoligonoPorDistritoItem[]) {
    const canvas = ref.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    const labels = data.map(d => d.distrito);
    const datasets = [
      { label: 'QA 1', data: data.map(d => d.q1), backgroundColor: STACKED_LOTE_COLORS[0] },
      { label: 'QA 2', data: data.map(d => d.q2), backgroundColor: STACKED_LOTE_COLORS[1] },
      { label: 'CIC',  data: data.map(d => d.cic), backgroundColor: STACKED_LOTE_COLORS[2] },
      { label: 'QA 3', data: data.map(d => d.qa3), backgroundColor: STACKED_LOTE_COLORS[3] },
      { label: 'QA 4', data: data.map(d => d.qa4), backgroundColor: STACKED_LOTE_COLORS[4] },
      { label: 'MUNI', data: data.map(d => d.muni), backgroundColor: STACKED_LOTE_COLORS[5] }
    ];

    new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true } },
        datasets: { bar: { barPercentage: 0.35, categoryPercentage: 0.55 } },
        plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } }
      }
    });
  }

  // Gráfico apilado "Total de Polígono por Lote"
  private initStackedLote(ref: ElementRef<HTMLCanvasElement>, data: ReportePoligonoPorLoteItem[]) {
    const canvas = ref.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    const labels = data.map(d => d.nombreLote);
    const datasets = [
      { label: 'QA 1', data: data.map(d => d.q1), backgroundColor: STACKED_LOTE_COLORS[0] },
      { label: 'QA 2', data: data.map(d => d.q2), backgroundColor: STACKED_LOTE_COLORS[1] },
      { label: 'CIC',  data: data.map(d => d.cic), backgroundColor: STACKED_LOTE_COLORS[2] },
      { label: 'QA 3', data: data.map(d => d.qa3), backgroundColor: STACKED_LOTE_COLORS[3] },
      { label: 'QA 4', data: data.map(d => d.qa4), backgroundColor: STACKED_LOTE_COLORS[4] },
      { label: 'MUNI', data: data.map(d => d.muni), backgroundColor: STACKED_LOTE_COLORS[5] }
    ];

    new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true } },
        datasets: { bar: { barPercentage: 0.35, categoryPercentage: 0.55 } },
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
