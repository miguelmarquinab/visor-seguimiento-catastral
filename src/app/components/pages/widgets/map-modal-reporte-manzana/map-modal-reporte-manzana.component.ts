import { Component, inject, AfterViewInit, ElementRef, ViewChild, signal, effect, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { switchMap, map } from 'rxjs';
import { UiStateService } from '../../../../services/ui-state.service';
import { ManzanaReporteService } from '../../../../services/manzana-reporte.service';
import { Chart, registerables } from 'chart.js';
import { registerReportChartPlugins } from '../../../../core/chart-plugins';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UbigeoComponent } from '../../../shared/ubigeo/ubigeo.component';
import { LoteSelectorComponent } from '../../../shared/lote-selector/lote-selector.component';
import { DistritoSelected } from '../../../../interfaces/DistritoSelected';
import type { ManzanaReportePorEstadoMapeado } from '../../../../interfaces/ReporteManzanaPorEstado.interface';
import type { ReporteManzanaPorDistritoItem } from '../../../../interfaces/ReporteManzanaPorDistrito.interface';
import {MatMenuModule} from '@angular/material/menu';
import {MatCardModule} from '@angular/material/card';

Chart.register(...registerables);
registerReportChartPlugins();

const BAR_CHART_COLORS = ['#eb5757a6', '#7d7a7ac2', '#9b51e0c0', '#f2984ac8', '#27ae5fd0', '#055b98d1'];

const SUMMARY_CARD_KEYS = [
  { key: 'total', label: 'Total de Manzanas', class: 'total' },
  { key: 'pendiente', label: 'Pendiente', class: 'pendiente' },
  { key: 'levantamiento', label: 'Levantamiento', class: 'levantamiento' },
  { key: 'edicion', label: 'Edición gráfica', class: 'edicion' },
  { key: 'calidad', label: 'Control calidad Int', class: 'calidad' },
  { key: 'terminada', label: 'Terminada', class: 'terminada' },
  { key: 'poligono', label: 'En polígono', class: 'poligono' }
] as const;

@Component({
  selector: 'app-map-modal-reporte-manzana',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, UbigeoComponent, LoteSelectorComponent, MatMenuModule, MatCardModule],
  templateUrl: './map-modal-reporte-manzana.component.html',
  styleUrl: './map-modal-reporte-manzana.component.css'
})
export class MapModalReporteManzanaComponent implements AfterViewInit {
  private readonly uiService = inject(UiStateService);
  private readonly manzanaReporteService = inject(ManzanaReporteService);

  distritosSeleccionados = this.uiService.distritosSeleccionados;

  /** Lista completa de códigos ubigeo permitidos para el usuario logado */
  allowedUbigeos = toSignal(
    this.uiService.allDistritos$.pipe(map(list => list.map(d => d.codigoUbigeo))),
    { initialValue: [] as string[] }
  );
  selectedUbigeos = computed(() => this.distritosSeleccionados().map(d => d.codigoUbigeo));

  /** Lista completa de distritos permitidos (para filtrar por lote). */
  allDistritos = toSignal(this.uiService.allDistritos$, { initialValue: [] as DistritoSelected[] });

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
      const value = this.getSummaryValue(data, key);
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
    const barCounts = data
      ? [data.pendiente, data.levantamiento, data.edicion, data.calidad, data.terminada, data.poligono]
      : [0, 0, 0, 0, 0, 0];

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pendiente', 'Levantamiento', 'Edición', 'Calidad', 'Terminada', 'Polígono'],
        datasets: [{
          label: 'Manzanas',
          data: barCounts,
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
            display: true
          },
          y: {
            min: 0,
            ticks: { callback: (v) => (typeof v === 'number' && Number.isInteger(v) ? String(v) : '') }
          }
        }
      }
    });
    chart.update();
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

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            beginAtZero: true,
            min: 0,
            ticks: { callback: (v) => (typeof v === 'number' && Number.isInteger(v) ? String(v) : '') }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
    chart.update();
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

  onLoteChange(ubigeos: string[]): void {
    if (ubigeos.length === 0) return;
    const set = new Set(ubigeos);
    const filtered = this.allDistritos().filter((d) => set.has(d.codigoUbigeo ?? ''));
    this.uiService.setDistritos(filtered);
  }

  quitarDistrito(codigoUbigeo: string): void {
    this.uiService.removeDistritos(codigoUbigeo);
  }
/*************JOEL*********/
  menuHover1 = false;
  menuHover2 = false;

  private closeTimeout1: any;
  private closeTimeout2: any;

  handleEnter(trigger: any, menuId: number) {
    if (menuId === 1) {
      clearTimeout(this.closeTimeout1);
    } else {
      clearTimeout(this.closeTimeout2);
    }

    if (!trigger.menuOpen) {
      trigger.openMenu();
    }
  }

  handleLeave(trigger: any, menuId: number) {
    const timeout = setTimeout(() => {
      const hover = menuId === 1 ? this.menuHover1 : this.menuHover2;

      if (!hover) {
        trigger.closeMenu();
      }

      if (menuId === 1) {
        this.menuHover1 = false;
      } else {
        this.menuHover2 = false;
      }

    }, 150);

    if (menuId === 1) {
      this.closeTimeout1 = timeout;
    } else {
      this.closeTimeout2 = timeout;
    }
  }

  getIconConfig(label: string): { icon: string; color: string } {

    switch (label) {
      case "Pendiente":
        return { icon: "chronic", color: "#f07c6c" }; // rojo

      case "Levantamiento":
        return { icon: "bar_chart", color: "#a1a1a1" }; // gris

      case "Edición gráfica":
        return { icon: "area_chart", color: "#b071eb" }; // morado

      case "Control calidad Int":
        return { icon: "deployed_code_account", color: "#f4ae70" }; // naranja 

      case "Terminada":
        return { icon: "check_circle", color: "#5dc98a" }; // verde

      case "En polígono":
        return { icon: "pie_chart", color: "#1b6dbf" }; // verde ocuro

      case "Total de Manzanas":
        return { icon: "insert_chart", color: "#003366" }; // azul

      default:
        return { icon: "insert_chart_outlined", color: "#7f8c8d" };
    }
  }

  private getSummaryValue(
    data: ManzanaReportePorEstadoMapeado | null,
    key: (typeof SUMMARY_CARD_KEYS)[number]['key']
  ): number {
    if (!data) return 0;

    if (key === 'total') {
      return data.totalManzanas;
    }

    const estados = {
      pendiente: data.pendiente,
      levantamiento: data.levantamiento,
      edicion: data.edicion,
      calidad: data.calidad,
      terminada: data.terminada,
      poligono: data.poligono
    } as const;

    return estados[key];
  }



}
