import { Component, inject, AfterViewInit, ElementRef, ViewChild, signal, effect, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { switchMap, map, combineLatest, Observable } from 'rxjs';
import { UiStateService } from '../../../../services/ui-state.service';
import { PoligonoReporteService } from '../../../../services/poligono-reporte.service';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import { registerReportChartPlugins } from '../../../../core/chart-plugins';
import { UbigeoComponent } from '../../../shared/ubigeo/ubigeo.component';
import { LoteSelectorComponent } from '../../../shared/lote-selector/lote-selector.component';
import { DistritoSelected } from '../../../../interfaces/DistritoSelected';
import type { ReportePoligonoPorLoteItem } from '../../../../interfaces/ReportePoligonoPorLote.interface';
import type { ReportePoligonoPorDistritoItem } from '../../../../interfaces/ReportePoligonoPorDistrito.interface';
import type { ReportePoligonoPorEstadoItem } from '../../../../interfaces/ReportePoligonoPorEstado.interface';
import type { ReporteUnidadCatastralPorEstadoItem } from '../../../../interfaces/ReporteUnidadCatastralPorEstado.interface';
import type { PoligonoListaEtapasItem } from '../../../../interfaces/PoligonoListaEtapas.interface';
import {MatMenuModule} from '@angular/material/menu';
import {MatCardModule} from '@angular/material/card';

Chart.register(...registerables);
registerReportChartPlugins();

const STACKED_LOTE_COLORS = ['#fecc29de', '#7fc569dc', '#a6a5a3e5', '#122c9fe0', '#f47d28e1', '#4990eedc'];
const STACKED_SERIES = [
  { label: 'QA 1', key: 'q1', color: STACKED_LOTE_COLORS[0] },
  { label: 'QA 2', key: 'q2', color: STACKED_LOTE_COLORS[1] },
  { label: 'CIC', key: 'cic', color: STACKED_LOTE_COLORS[2] },
  { label: 'QA 3', key: 'qa3', color: STACKED_LOTE_COLORS[3] },
  { label: 'QA 4', key: 'qa4', color: STACKED_LOTE_COLORS[4] },
  { label: 'MUNI', key: 'muni', color: STACKED_LOTE_COLORS[5] }
] as const;

type StackedPoligonoItem = {
  q1: number;
  q2: number;
  cic: number;
  qa3: number;
  qa4: number;
  muni: number;
};

@Component({
  selector: 'app-map-modal-reporte-poligono',
  standalone: true,
  imports: [CommonModule, MatIconModule, UbigeoComponent, LoteSelectorComponent, MatMenuModule, MatCardModule],
  templateUrl: './map-modal-reporte-poligono.component.html',
  styleUrl: './map-modal-reporte-poligono.component.css'
})
export class MapModalReportePoligonoComponent implements AfterViewInit {
  public uiService = inject(UiStateService);
  private readonly poligonoReporteService = inject(PoligonoReporteService);
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
  private readonly selectedUbigeos$ = toObservable(this.selectedUbigeos);

  /** Lista completa de distritos permitidos (para filtrar por lote). */
  allDistritos = toSignal(this.uiService.allDistritos$, { initialValue: [] as DistritoSelected[] });

  reportePorEstadoData = this.signalFromUbigeos(
    ubigeos => this.poligonoReporteService.getReportePorEstado(ubigeos),
    null as ReportePoligonoPorEstadoItem | null
  );

  reportePorDistritoData = this.signalFromUbigeos(
    ubigeos => this.poligonoReporteService.getReportePorDistrito(ubigeos),
    [] as ReportePoligonoPorDistritoItem[]
  );

  reportePorLoteData = this.signalFromUbigeos(
    ubigeos => this.poligonoReporteService.getReportePorLote(ubigeos),
    [] as ReportePoligonoPorLoteItem[]
  );

  reporteUnidadCatastralData = this.signalFromUbigeos(
    ubigeos => this.poligonoReporteService.getReporteUnidadCatastralPorEstado(ubigeos),
    null as ReporteUnidadCatastralPorEstadoItem | null
  );

  /** Paginación tabla listado etapas: página actual (0-based) y tamaño de página */
  currentPageEtapas = signal(0);
  readonly pageSizeEtapas = 10;

  /** Listado de etapas paginado (data + total desde el servicio) */
  listarEtapasResult = toSignal(
    combineLatest([
      this.selectedUbigeos$,
      toObservable(this.currentPageEtapas)
    ]).pipe(
      switchMap(([ubigeos, page]) => {
        return this.poligonoReporteService.getListaEtapas(ubigeos, page + 1, this.pageSizeEtapas);
      })
    ),
    { initialValue: { data: [] as PoligonoListaEtapasItem[], total: 0 } }
  );

  /** Información de paginación para la tabla de etapas */
  paginacionEtapas = computed(() => {
    const total = this.listarEtapasResult().total;
    const page = this.currentPageEtapas();
    const size = this.pageSizeEtapas;
    const totalPages = Math.max(1, Math.ceil(total / size));
    const start = total === 0 ? 0 : page * size + 1;
    const end = Math.min((page + 1) * size, total);
    return {
      start,
      end,
      total,
      totalPages,
      hasPrev: page > 0,
      hasNext: page < totalPages - 1
    };
  });

  goToPrevPageEtapas(): void {
    if (this.paginacionEtapas().hasPrev) {
      this.currentPageEtapas.update(p => p - 1);
    }
  }

  goToNextPageEtapas(): void {
    if (this.paginacionEtapas().hasNext) {
      this.currentPageEtapas.update(p => p + 1);
    }
  }

  private signalFromUbigeos<T>(request: (ubigeos: string[]) => Observable<T>, initialValue: T) {
    return toSignal(
      this.selectedUbigeos$.pipe(
        switchMap(ubigeos => request(ubigeos))
      ),
      { initialValue }
    );
  }

  // Referencias a los 4 lienzos de los gráficos
  @ViewChild('chart1') chart1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart2') chart2!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart3') chart3!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart4') chart4!: ElementRef<HTMLCanvasElement>;

  constructor() {
    effect(() => {
      this.distritosSeleccionados();
      this.currentPageEtapas.set(0);
    });
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

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: color, borderRadius: 4 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          barCountLabel: { counts: data }
        } as Record<string, unknown>,
        scales: {
          y: {
            min: 0,
            ticks: { callback: (v) => (typeof v === 'number' && Number.isInteger(v) ? String(v) : '') }
          }
        }
      }
    });
    chart.update();
  }

  /** Gráfico apilado "Total de Polígono por distrito" */
  private initStackedDistrito(ref: ElementRef<HTMLCanvasElement>, data: ReportePoligonoPorDistritoItem[]) {
    this.initStacked(ref, data, d => d.distrito);
  }

  /** Gráfico apilado "Total de Polígono por Lote" */
  private initStackedLote(ref: ElementRef<HTMLCanvasElement>, data: ReportePoligonoPorLoteItem[]) {
    this.initStacked(ref, data, d => d.nombreLote);
  }

  private initStacked<T extends StackedPoligonoItem>(
    ref: ElementRef<HTMLCanvasElement>,
    data: T[],
    labelSelector: (item: T) => string
  ): void {
    const canvas = ref.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    const labels = data.map(labelSelector);
    const datasets = STACKED_SERIES.map(({ label, key, color }) => ({
      label,
      data: data.map(d => d[key]),
      backgroundColor: color
    }));

    const chart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            min: 0,
            ticks: { callback: (v) => (typeof v === 'number' && Number.isInteger(v) ? String(v) : '') }
          }
        },
        datasets: { bar: { barPercentage: 0.6, categoryPercentage: 0.8 } },
        plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } }
      }
    });
    chart.update();
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

  onLoteChange(ubigeos: string[]): void {
    if (ubigeos.length === 0) return;
    const set = new Set(ubigeos);
    const filtered = this.allDistritos().filter((d) => set.has(d.codigoUbigeo ?? ''));
    this.uiService.setDistritos(filtered);
  }

  quitarDistrito(codigo: string) {
    this.uiService.removeDistritos(codigo);
  }
}
