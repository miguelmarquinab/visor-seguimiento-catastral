import { Component, inject, AfterViewInit, ElementRef, ViewChild, signal, effect, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { switchMap, map } from 'rxjs';
import { UiStateService } from '../../../../services/ui-state.service';
import { ManzanaReporteService } from '../../../../services/manzana-reporte.service';
import { Chart, registerables } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UbigeoComponent } from '../../../shared/ubigeo/ubigeo.component';
import { DistritoSelected } from '../../../../interfaces/DistritoSelected';
import type { ManzanaReportePorEstadoMapeado } from '../../../../interfaces/ReporteManzanaPorEstado.interface';
import type { ReporteManzanaPorDistritoItem } from '../../../../interfaces/ReporteManzanaPorDistrito.interface';

Chart.register(...registerables);

const BAR_CHART_COLORS = ['#f2c94c', '#2d9cdb', '#9b51e0', '#f2994a', '#27ae60', '#eb5757'];
const BAR_LABEL_MIN_HEIGHT_PX = 22;
const STACKED_SEGMENT_LABEL_MIN_HEIGHT_PX = 24;

// Plugin: etiqueta numérica dentro de cada barra (Total de Manzanas)
const barCountLabelPlugin = {
  id: 'barCountLabel',
  afterDatasetsDraw(chart: Chart) {
    const counts = (chart.options.plugins as Record<string, { counts?: number[] }>)?.['barCountLabel']?.counts;
    if (!counts?.length || !chart.getDatasetMeta(0)) return;
    const ctx = chart.ctx;
    chart.data.datasets?.[0]?.data?.forEach((_, i) => {
      const meta = chart.getDatasetMeta(0).data[i] as unknown as { x: number; y: number; base: number };
      if (!meta) return;
      const count = counts[i] ?? 0;
      const barHeightPx = Math.abs(meta.base - meta.y);
      const topY = Math.min(meta.base, meta.y);
      const centerY = (meta.base + meta.y) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '600 12px sans-serif';
      ctx.fillStyle = '#333';
      if (barHeightPx < BAR_LABEL_MIN_HEIGHT_PX) {
        ctx.textBaseline = 'middle';
        ctx.fillText(String(count), meta.x, centerY);
      } else {
        ctx.textBaseline = 'top';
        ctx.fillText(String(count), meta.x, topY + 4);
      }
      ctx.restore();
    });
  }
};
Chart.register(barCountLabelPlugin);

/** Plugin: total en la parte superior de cada segmento del gráfico apilado (Estado por distrito). */
const stackedBarSegmentLabelPlugin = {
  id: 'stackedBarSegmentLabel',
  afterDatasetsDraw(chart: Chart) {
    const datasets = chart.data.datasets;
    if (!datasets?.length || datasets.length <= 1) return;
    const ctx = chart.ctx;
    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < datasets.length; i++) {
      const meta = chart.getDatasetMeta(i);
      const data = datasets[i]?.data ?? [];
      for (let j = 0; j < meta.data.length; j++) {
        const value = data[j];
        const num = typeof value === 'number' ? value : Number(value);
        if (num === 0) continue;
        const el = meta.data[j] as unknown as { x: number; y: number; base: number };
        const segmentHeightPx = Math.abs(el.base - el.y);
        if (segmentHeightPx < STACKED_SEGMENT_LABEL_MIN_HEIGHT_PX) continue;
        const topY = Math.min(el.base, el.y);
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(String(num), el.x, topY + 4);
      }
    }
    ctx.restore();
  }
};
Chart.register(stackedBarSegmentLabelPlugin);

const SUMMARY_CARD_KEYS = [
  { key: 'total', label: 'Total de Manzanas', class: 'total' },
  { key: 'pendiente', label: 'Pendiente', class: 'pendiente' },
  { key: 'levantamiento', label: 'Levantamiento', class: 'levantamiento' },
  { key: 'edicion', label: 'Edición gráfica', class: 'edicion' },
  { key: 'calidad', label: 'Control de calidad Int', class: 'calidad' },
  { key: 'terminada', label: 'Terminada', class: 'terminada' },
  { key: 'poligono', label: 'En polígono', class: 'poligono' }
] as const;

@Component({
  selector: 'app-map-modal-reporte-manzana',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, UbigeoComponent],
  templateUrl: './map-modal-reporte-manzana.component.html',
  styleUrl: './map-modal-reporte-manzana.component.css'
})
export class MapModalReporteManzanaComponent implements AfterViewInit {
  private uiService = inject(UiStateService);
  private manzanaReporteService = inject(ManzanaReporteService);

  distritosSeleccionados = this.uiService.distritosSeleccionados;

  /** Lista completa de códigos ubigeo permitidos para el usuario logado */
  allowedUbigeos = toSignal(
    this.uiService.allDistritos$.pipe(map(list => list.map(d => d.codigoUbigeo))),
    { initialValue: [] as string[] }
  );
  selectedUbigeos = computed(() => this.distritosSeleccionados().map(d => d.codigoUbigeo));

  isMaximized = signal(true);
  /** Panel lateral izquierdo (filtros) plegado */
  sidebarCollapsed = signal(false);

  reporteData = toSignal(
    toObservable(this.distritosSeleccionados).pipe(
      switchMap(distritos => {
        const ubigeos = distritos.map(d => d.codigoUbigeo);
        return this.manzanaReporteService.getReportePorEstado(ubigeos);
      })
    ),
    { initialValue: null as ManzanaReportePorEstadoMapeado | null }
  );

  reportePorDistritoData = toSignal(
    toObservable(this.distritosSeleccionados).pipe(
      switchMap(distritos => {
        const ubigeos = distritos.map(d => d.codigoUbigeo);
        return this.manzanaReporteService.getReportePorDistrito(ubigeos);
      })
    ),
    { initialValue: [] as ReporteManzanaPorDistritoItem[] }
  );

  /** Tarjetas de resumen derivadas del reporte (Total + estados mapeados). */
  summaryCards = computed(() => {
    const data = this.reporteData();
    return SUMMARY_CARD_KEYS.map(({ key, label, class: c }) => {
      const value = key === 'total'
        ? (data?.totalManzanas ?? 0)
        : (data ? (data[key as keyof ManzanaReportePorEstadoMapeado] as number) : 0);
      return { label, value, class: c };
    });
  });

  barChartLegendItems = computed(() =>
    SUMMARY_CARD_KEYS.slice(1).map((c, i) => ({
      label: c.label,
      color: BAR_CHART_COLORS[i] ?? '#999'
    }))
  );

  // Leyenda del gráfico apilado (Estado de Manzanas por distrito)
  stackedChartLegend = computed(() =>
    SUMMARY_CARD_KEYS.slice(1).map((c, i) => ({
      label: c.label,
      color: BAR_CHART_COLORS[i] ?? '#999'
    }))
  );

  @ViewChild('barChart') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stackedChart') stackedChartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor() {
    effect(() => {
      this.reporteData();
      this.reportePorDistritoData();
      this.distritosSeleccionados();
      setTimeout(() => this.renderCharts(), 50);
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

    const data = this.reporteData();
    const barValuesPct = data
      ? [data.pctPendiente, data.pctLevantamiento, data.pctEdicion, data.pctCalidad, data.pctTerminada, data.pctPoligono]
      : [0, 0, 0, 0, 0, 0];
    const barCounts = data
      ? [data.pendiente, data.levantamiento, data.edicion, data.calidad, data.terminada, data.poligono]
      : [0, 0, 0, 0, 0, 0];

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pendiente', 'Levantamiento', 'Edición', 'Calidad', 'Terminada', 'Polígono'],
        datasets: [{
          label: 'Manzanas',
          data: barValuesPct,
          backgroundColor: BAR_CHART_COLORS
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          barCountLabel: { counts: barCounts }
        } as Record<string, unknown>,
        scales: {
          x: {
            display: false
          },
          y: {
            min: 0,
            max: 100,
            ticks: { callback: (v) => (typeof v === 'number' ? v + '%' : v) }
          }
        }
      }
    });
  }

  private initStackedChart() {
    const canvas = this.stackedChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    const data = this.reportePorDistritoData();
    const labels = data.map(d => d.distrito);
    const estadoLabels = SUMMARY_CARD_KEYS.slice(1);
    const datasets = [
      { label: estadoLabels[0].label, data: data.map(d => d.estado01), backgroundColor: BAR_CHART_COLORS[0] },
      { label: estadoLabels[1].label, data: data.map(d => d.estado02), backgroundColor: BAR_CHART_COLORS[1] },
      { label: estadoLabels[2].label, data: data.map(d => d.estado03), backgroundColor: BAR_CHART_COLORS[2] },
      { label: estadoLabels[3].label, data: data.map(d => d.estado04), backgroundColor: BAR_CHART_COLORS[3] },
      { label: estadoLabels[4].label, data: data.map(d => d.estado05), backgroundColor: BAR_CHART_COLORS[4] },
      { label: estadoLabels[5].label, data: data.map(d => d.estado06), backgroundColor: BAR_CHART_COLORS[5] }
    ];

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  onDistritoSeleccionado(event: { ubigeo: string; distrito: string }): void {
    const nuevoDistrito: Partial<DistritoSelected> = {
      codigoUbigeo: event.ubigeo,
      distrito: event.distrito,
      idOrganizacion: Date.now(),
      provincia: '',
      departamento: '',
      nombreOrganizacion: ''
    };
    this.uiService.addDistritos(nuevoDistrito as DistritoSelected);
  }

  quitarDistrito(codigoUbigeo: string): void {
    this.uiService.removeDistritos(codigoUbigeo);
  }
}
