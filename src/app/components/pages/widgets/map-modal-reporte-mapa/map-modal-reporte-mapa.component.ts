import { Component, ViewChild, ElementRef, AfterViewInit, inject, OnInit, HostListener, effect,computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Chart, registerables } from 'chart.js';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UiStateService } from '../../../../services/ui-state.service';
import { ModoFiltro } from '../../../../enums/ModoFiltro';
import { MapService } from '../../../../services/map.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MapaConteoService } from '../../../../services/mapa-conteo.service';

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
    MatTooltip
  ],
  templateUrl: './map-modal-reporte-mapa.component.html',
  styleUrl: './map-modal-reporte-mapa.component.css'
})
export class MapModalReporteMapaComponent implements OnInit, AfterViewInit {
  public sidebarOpen = true;
  private chart: Chart | null = null;
  private chartPoligono: Chart | null = null;
  public uiService = inject(UiStateService);
  mensajeDibujo = this.uiService.mensajeDibujo$;
  private readonly mapaConteoService = inject(MapaConteoService);
  private readonly mapService = inject(MapService);
  distritosSeleccionados = this.uiService.distritosSeleccionados;
  selectedUbigeos = computed(() =>
    this.distritosSeleccionados().map((d) => d.codigoUbigeo),
  );
  //para manzana
  @ViewChild('statsChart', { static: false }) statsChart!: ElementRef<HTMLCanvasElement>;
  //para poligono
  @ViewChild('statsChartPoligono', { static: false }) statsChartPoligono!: ElementRef<HTMLCanvasElement>;

  private readonly COLORES_ESTADOS: { [key: string]: string } = {
    "01": '#E55645', // Pendiente
    "02": '#868686', // Levantamiento
    "03": '#B55AF0', // Edición gráfica
    "04": '#E79314', // Control de calidad interno
    "05": '#20B320', // Terminada
    "06": '#055a98', // En Polígono
  };

    private readonly COLORES_ESTADOS_POLIGONO: { [key: string]: string } = {
    "QA1": '#FECC29', 
    "QA2": '#7FC569', 
    "CIC": '#A6A5A3', 
    "QA3": '#122D9F', 
    "QA4": '#F47E28', 
    "MUNI": '#4991EE',

  };
  constructor() {

  
    this.uiService.setPanelActivo('manzana');
    effect(() => {
      const estadosActivos = this.uiService.estadosManzana();
      const nuevosDatos = this.uiService.datosConteoManzanas();
      const filtrados = nuevosDatos.filter(d => estadosActivos.includes(d.estado));

      if (this.chart) {
        this.updateChart(filtrados);
      }
    });

    effect(() => {

      const estadosActivos = this.uiService.estadosPoligono();
      const nuevosDatos = this.uiService.datosConteoPoligonos();
      // filtramos aquí
      const filtrados = nuevosDatos.filter(d => estadosActivos.includes(d.estado));

      if (this.chartPoligono) {
        this.updateChartPoligono(filtrados);
      }

    });
  }

  ngOnInit() {
    this.checkScreen();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initChart();
      this.initChartPoligono();
    }, 0);
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreen();
  }

  checkScreen() {
    this.sidebarOpen = window.innerWidth > 600;
  }

  private initChart() {
    if (!this.statsChart) return;

    const ctx = this.statsChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const initialData = this.uiService.datosConteoManzanas();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: initialData.map(d => d.nombreEstado),
        datasets: [{
          label: 'Cantidad de Manzanas',
          data: initialData.map(d => d.nroManzanas),
          backgroundColor: initialData.map(d => this.getColor(d.estado)),
          borderRadius: 5,
          barThickness: 20
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const dataActual = this.uiService.datosConteoManzanas()[index];
            this.uiService.selectCategory(dataActual.nombreEstado);
          } else {
            this.uiService.selectCategory(null);
          }
        },
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: '#f0f0f0' },
            ticks: { callback: (v) => (typeof v === 'number' && Number.isInteger(v) ? String(v) : '') }
          },
          x: { 
            grid: { display: false },
            ticks: { display: false }
          }
        }
      }
    });
  }

  private initChartPoligono() {

    if (!this.statsChartPoligono) return;

    const ctx = this.statsChartPoligono.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.uiService.datosConteoPoligonos();

    this.chartPoligono = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.nombreEstado),
        datasets: [{
          label: 'Cantidad de Polígonos',
          data: data.map(d => d.nroPoligonos),
          backgroundColor: data.map(d => this.getColorPoligono(d.estado)),
          borderRadius: 5,
          barThickness: 20
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: true,
            ticks: { callback: (v) => (typeof v === 'number' && Number.isInteger(v) ? String(v) : '') } 
          },
          x: { 
            grid: { display: false },
            ticks: { display: false }
          }
        }
      }
    });
  }

  private updateChart(data: any[]) {
    if (!this.chart) return;
    this.chart.data.labels = data.map(d => d.nombreEstado);
    this.chart.data.datasets[0].data = data.map(d => d.nroManzanas);
    this.chart.data.datasets[0].backgroundColor = data.map(d => this.getColor(d.estado));
    
    this.chart.update();
  }

  private updateChartPoligono(data: any[]) {
    if (!this.chartPoligono) return;
    this.chartPoligono.data.labels = data.map(d => d.nombreEstado);
    this.chartPoligono.data.datasets[0].data = data.map(d => d.nroPoligonos);
    this.chartPoligono.data.datasets[0].backgroundColor = data.map(d => this.getColorPoligono(d.estado));
    
    this.chartPoligono.update();
  }

  public getColor(estado: string): string {
    if (this.COLORES_ESTADOS[estado]) {
      return this.COLORES_ESTADOS[estado];
    }
    return this.generateDynamicColor(estado);
  }

  public getColorPoligono(estado: string): string {
    if (this.COLORES_ESTADOS_POLIGONO[estado]) {
      return this.COLORES_ESTADOS_POLIGONO[estado];
    }
    return this.generateDynamicColor(estado);
  }

  private generateDynamicColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (str.codePointAt(i) ?? 0) + ((hash << 5) - hash);
    }
    const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - color.length) + color;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  exportar(formato: string) {
    console.log('Exportando reporte de manzanas a:', formato);
  }

  activarDibujo() {
    this.uiService.setDrawPolygon(true);
    this.uiService.setModoFiltro(ModoFiltro.DIBUJANDO);
  }

  limpiarDibujo() {
    this.uiService.setDrawPolygon(false);
    this.uiService.setModoFiltro(ModoFiltro.PANTALLA);
    this.mapaConteoService.actualizarConteoEstados(this.selectedUbigeos());
  }
}