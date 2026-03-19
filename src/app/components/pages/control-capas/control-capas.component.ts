import {
  Component,
  OnDestroy,
  OnInit,
  Input,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MapService } from '../../../services/map.service';
import { UiStateService } from '../../../services/ui-state.service';
import { DistritoSelected } from '../../../interfaces/DistritoSelected';
import { DistritoMultiselectComponent } from '../../shared/distrito-multiselect/distrito-multiselect.component';
import { LoteSelectorComponent } from '../../shared/lote-selector/lote-selector.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { DemoLayersService } from '../../../services/demo-layers.service';
import { environment } from './../../../../environments/environment';
import { ManzanaReporteService } from '../../../services/manzana-reporte.service';
import { PoligonoReporteService } from '../../../services/poligono-reporte.service';
import { ModoFiltro } from '../../../enums/ModoFiltro';

type LayerItem = { id: string; label: string; checked: boolean };

@Component({
  selector: 'app-control-capas',
  standalone: true,
  imports: [
    CommonModule,
    DistritoMultiselectComponent,
    LoteSelectorComponent,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './control-capas.component.html',
  styleUrls: ['./control-capas.component.css'],
})
export class ControlCapasComponent implements OnInit, OnDestroy {
  private readonly demoLayers = inject(DemoLayersService);
  private readonly poligonoService = inject(PoligonoReporteService);
  private readonly manzanaService = inject(ManzanaReporteService);
  @Input() embedded = false;
  expandedManzana = true;
  expandedPoligono = false;
  opacity = 1;
  mostrarDiv = false;

  allDistritos: DistritoSelected[] = [];

  private readonly sub = new Subscription();

  showDistritoModal = false;
  showAddDistrito = false;
  filtroDistrito = '';
  private readonly selectedIds = new Set<number>(); // para marcar rápido
  private selectedCapa = 1;

  public uiService = inject(UiStateService);
  distritosSeleccionados = this.uiService.distritosSeleccionados;
  selectedUbigeos = computed(() =>
    this.distritosSeleccionados().map((d) => d.codigoUbigeo),
  );

  manzana: LayerItem[] = [
    { id: '01', label: 'Pendiente', checked: true },
    { id: '02', label: 'Levantamiento', checked: true },
    { id: '03', label: 'Edición gráfica', checked: true },
    { id: '04', label: 'Control de calidad interno', checked: true },
    { id: '05', label: 'Terminada', checked: true },
    { id: '06', label: 'En polígono', checked: true },
  ];

  poligonos: LayerItem[] = [
    { id: 'QA1', label: 'QA1', checked: true },
    { id: 'QA2', label: 'QA2', checked: true },
    { id: 'CIC', label: 'Consulta Información Catastral', checked: true },
    { id: 'QA3', label: 'QA3', checked: true },
    { id: 'QA4', label: 'QA4', checked: true },
    { id: 'MUNI', label: 'Municipalidad', checked: true },
  ];

  constructor(
    private readonly mapService: MapService,
    private readonly ui: UiStateService,
    private readonly layers: DemoLayersService,
  ) {}

  ngOnInit(): void {
    // Prender capas por defecto
    this.manzana
      .filter((x) => x.checked)
      .forEach((x) => this.mapService.addLayer(x.id));

    this.sub.add(
      this.ui.distritos$.subscribe(() => this.aplicarFiltros()),
    );

    this.sub.add(
      this.ui.allDistritos$.subscribe((list) => {
        this.allDistritos = list ?? [];
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  aplicarFiltros() {
    const filtroCombinado = this.construirFiltroCombinado();
    this.layers.updatLayer(filtroCombinado);
  }

  construirFiltroCombinado(): string {
    const condiciones: string[] = [];
    const selected = this.distritosSeleccionados();
    const campo_ubigeo = 'cod_ubigeo';

    if (selected.length > 1) {
      const ubigeos = selected.map((d) => d.codigoUbigeo);
      condiciones.push(`${campo_ubigeo} IN (${ubigeos.join(',')})`);
    } else if (selected.length === 1) {
      condiciones.push(
        `${campo_ubigeo} = '${selected[0].codigoUbigeo}'`,
      );
    }

    const capa = this.layers.capas.find((c) => c.id == this.selectedCapa);
    const nroEstados =
      this.selectedCapa == 1 ? this.manzana.length : this.poligonos.length;

    if (capa?.estados.length !== nroEstados) {
      const valores = capa?.estados.map((v) => `'${v}'`);
      const nombreCampo = this.selectedCapa == 1 ? 'estado_manzana' : 'etapa';
      condiciones.push(`${nombreCampo} IN (${valores?.join(',')})`);
    }

    if (condiciones.length === 0) {
      return '1=0';
    }

    return condiciones.join(' AND ');
  }

  onDistritosChange(next: DistritoSelected[]): void {
    this.ui.setDistritos(next);
    this.loadDistritosAsync(next);
  }

  onLoteChange(ubigeos: string[]): void {
    if (ubigeos.length === 0) {
      this.ui.setDistritos([]);
      this.loadDistritosAsync([]);
      return;
    }
    const set = new Set(ubigeos);
    const filtered = this.allDistritos.filter((d) => set.has(d.codigoUbigeo ?? ''));
    this.ui.setDistritos(filtered);
    this.loadDistritosAsync(filtered);
  }

  openDistritoModal(): void {
    this.filtroDistrito = '';
    this.showDistritoModal = true;
  }

  closeDistritoModal(): void {
    this.showDistritoModal = false;
  }

  get distritosFiltrados(): DistritoSelected[] {
    const q = (this.filtroDistrito ?? '').trim().toLowerCase();
    if (!q) return this.allDistritos;
    return this.allDistritos.filter(
      (d) =>
        (d.distrito ?? '').toLowerCase().includes(q) ||
        (d.provincia ?? '').toLowerCase().includes(q) ||
        (d.departamento ?? '').toLowerCase().includes(q),
    );
  }

  /** Ubigeos de todos los distritos permitidos (para filtro de ubigeos no asignados a lote). */
  get allUbigeos(): string[] {
    return this.allDistritos
      .map((d) => d.codigoUbigeo)
      .filter((u): u is string => !!u);
  }

  isDistritoSelected(d: DistritoSelected): boolean {
    return this.selectedIds.has(d.idOrganizacion);
  }

  toggleDistrito(d: DistritoSelected): void {
    if (this.selectedIds.has(d.idOrganizacion))
      this.selectedIds.delete(d.idOrganizacion);
    else this.selectedIds.add(d.idOrganizacion);
  }

  aplicarDistritos(): void {
    // construimos el nuevo array desde allDistritos usando selectedIds
    const next: DistritoSelected[] = this.allDistritos
      .filter((d) => this.selectedIds.has(d.idOrganizacion))
      .map((d) => ({
        idOrganizacion: d.idOrganizacion,
        codigoUbigeo: d.codigoUbigeo,
        distrito: d.distrito,
        provincia: d.provincia,
        departamento: d.departamento,
        nombreOrganizacion: d.nombreOrganizacion,
        logo: d.logo ?? null,
      }));

    this.ui.setDistritos(next);
    this.closeDistritoModal();

    this.loadDistritosAsync(next);
  }

  toggleExpandManzana(): void {

    const modo = this.uiService.modoFiltro$();  
    if (modo === ModoFiltro.AREA) {
      const payload = this.uiService.getFiltroGeometrico();
      this.manzanaService
            .getConteoGeoJson(this.selectedUbigeos(), payload)
            .subscribe((data: any) => {
              this.uiService.updateConteoManzanas(data);
            });
    }else{
      const coords = this.mapService.getBoundsCoords();
      this.manzanaService
            .getConteoEstados(coords, this.selectedUbigeos())
            .subscribe((data: any) => {
              this.uiService.updateConteoManzanas(data);
            });
    }

    this.expandedManzana = !this.expandedManzana;
    if (this.expandedManzana) {
      this.selectedCapa = 1;
      this.expandedPoligono = false;
      this.ui.setPanelActivo('manzana');
      this.mapService.removeSelectedWmsLayer();
      
      if (!this.mapService.hasSelectedWms()) {
        let capaInicial = this.demoLayers.capas[0];
        this.mapService.addWmsLayer(
          capaInicial.workspace,
          capaInicial.layerName,
        );
        this.aplicarFiltros();
      }
      this.mapService.clearCategoryLayers('po_'); // Limpia polígonos
      this.manzana
        .filter((m) => m.checked)
        .forEach((m) => this.mapService.addLayer(m.id));

    }
  }

  toggleExpandPoligonoPanel(): void {
     const modo = this.uiService.modoFiltro$();  
    if (modo === ModoFiltro.AREA) {
      const payload = this.uiService.getFiltroGeometrico();
       this.poligonoService
            .getConteoGeoJson(this.selectedUbigeos(), payload)
            .subscribe((data: any) => {
              this.uiService.updateConteoManzanas(data);
            });
    }else{
      const coords = this.mapService.getBoundsCoords();
      this.poligonoService
          .getConteoEstados(coords, this.selectedUbigeos())
          .subscribe((data: any) => {
            this.uiService.updateConteoPoligonos(data);
          });

    }
 
    this.expandedPoligono = !this.expandedPoligono;
    if (this.expandedPoligono) {
      this.selectedCapa = 2;
      this.expandedManzana = false;
      this.ui.setPanelActivo('poligono');
      this.mapService.removeSelectedWmsLayer();
      if (!this.mapService.hasSelectedWms()) {
        let capaInicial = this.demoLayers.capas[1];
        this.mapService.addWmsLayer(
          capaInicial.workspace,
          capaInicial.layerName,
        );
        this.aplicarFiltros();
      }
      this.mapService.clearCategoryLayers('mz_'); // Limpia manzanas
      this.poligonos
        .filter((p) => p.checked)
        .forEach((p) => this.mapService.addLayer(p.id));
    }
  }

  onToggleManzana(item: LayerItem): void {
    item.checked = !item.checked;
    console.log(item);
    if (item.checked) {
      if (!this.layers.capas[0].estados.includes(item.id)) {
        this.layers.capas[0].estados.push(item.id);
      }
    } else {
      const index = this.layers.capas[0].estados.indexOf(item.id);
      if (index > -1) {
        this.layers.capas[0].estados.splice(index, 1);
      }
    }
    this.ui.setEstadosManzana([...this.layers.capas[0].estados]);
    this.aplicarFiltros();
  }

  onToggle(item: LayerItem): void {
    item.checked = !item.checked;
    console.log(item);
    if (item.checked) {
      if (!this.layers.capas[1].estados.includes(item.id)) {
        this.layers.capas[1].estados.push(item.id);
      }
    } else {
      const index = this.layers.capas[1].estados.indexOf(item.id);
      if (index > -1) {
        this.layers.capas[1].estados.splice(index, 1);
      }
    }
    this.ui.setEstadosPoligono([...this.layers.capas[1].estados]);
    this.aplicarFiltros();
  }

  onOpacityChange(ev: Event): void {
    const value = Number((ev.target as HTMLInputElement).value);
    this.opacity = value;

    this.manzana.forEach((x) => {
      if (x.checked) this.mapService.setOpacity(x.id, this.opacity);
    });
  }

  private loadDistritosAsync(distritos: DistritoSelected[]): void {
    console.log(
      'Cargando data para distritos:',
      distritos.map((d) => d.codigoUbigeo),
    );
  }

  cerrarDistritos() {
    this.mostrarDiv = false; // cerrar modal
  }
  flagSector = false;

  onToggleSector(): void {
    this.flagSector = !this.flagSector;
    if (this.flagSector) {
      const ubigeos = this.selectedUbigeos();
      if (!ubigeos || ubigeos.length === 0) {
        console.warn('No hay ubigeos seleccionados');
        return;
      }
      const cql = `cod_ubigeo IN (${ubigeos.map((u: string) => "'" + u + "'").join(',')})`;
      this.mapService.addSectorLayer(environment.espacioTrabajoDashboardGeoserver, 'tg_sector', cql, 10);
    } else {
      this.mapService.removeSectorLayer();
    }
  }
  flagIntervencion = false;
  onToggleIntervencion(): void {
    this.flagIntervencion = !this.flagIntervencion;
    if (this.flagIntervencion) {
      const ubigeos = this.selectedUbigeos();
      if (!ubigeos || ubigeos.length === 0) {
        console.warn('No hay ubigeos seleccionados');
        return;
      }
      const cql = `ubigeo IN (${ubigeos.map((u: string) => "'" + u + "'").join(',')})`;
      this.mapService.addIntervencionLayer(environment.espacioTrabajoDashboardGeoserver, 'tg_area_intervencion', cql, 110);
    } else {
      this.mapService.removeIntervencionLayer();
    }
  }
}
