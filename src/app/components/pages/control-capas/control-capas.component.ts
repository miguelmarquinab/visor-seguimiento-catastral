import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MapService } from '../../../services/map.service';
import { UiStateService } from '../../../services/ui-state.service';

import { DistritoSelected } from '../../../interfaces/DistritoSelected';
import { DistritoMultiselectComponent } from '../../shared/distrito-multiselect/distrito-multiselect.component';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatMenuModule} from '@angular/material/menu';
import { DemoLayersService } from '../../../services/demo-layers.service';

type LayerItem = { id: string; label: string; checked: boolean; };

@Component({
  selector: 'app-control-capas',
  standalone: true,
  imports: [
    CommonModule,
    DistritoMultiselectComponent,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './control-capas.component.html',
  styleUrls: ['./control-capas.component.css'],
})
export class ControlCapasComponent implements OnInit, OnDestroy {
  @Input() embedded = false;
  expandedManzana = true;
  expandedPoligono = false;
  opacity = 1;
  mostrarDiv = false;

  allDistritos: DistritoSelected[] = [];
  selectedDistritos: DistritoSelected[] = [];

  private sub = new Subscription();

  showDistritoModal = false;
  showAddDistrito = false;
  filtroDistrito = '';
  private selectedIds = new Set<number>(); // para marcar rápido
  private selectedCapa = 1;

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
    private mapService: MapService,
    private ui: UiStateService,
    private layers: DemoLayersService
  ) {}

  ngOnInit(): void {
    // Prender capas por defecto
    this.manzana.filter(x => x.checked).forEach(x => this.mapService.addLayer(x.id));

    // Al abrir, prende lo que está en checked=true
    //this.manzanas.forEach(i => i.checked && this.mapService.addLayer(i.id));
    //this.poligonos.forEach(i => i.checked && this.mapService.addLayer(i.id));

    this.sub.add(
      this.ui.distritos$.subscribe((ds: DistritoSelected[]) => {
        this.selectedDistritos = ds ?? [];
         this.aplicarFiltros();
      })
    );

    this.sub.add(
      this.ui.allDistritos$.subscribe((list) => {
        this.allDistritos = list ?? [];
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  aplicarFiltros(){
    const filtroCombinado = this.construirFiltroCombinado();
    this.layers.updatLayer(filtroCombinado);
  }

  construirFiltroCombinado(): string{
    const condiciones: string[] = [];
    let campo_ubigeo = this.selectedCapa == 1 ? "cod_ubigeo"  : "ubigeo";
    
    if(this.selectedDistritos.length > 1){
      const ubigeos = this.selectedDistritos.map(d => d.codigoUbigeo)
      condiciones.push(`${campo_ubigeo} IN (${ubigeos.join(',')})`);
    } else if (this.selectedDistritos.length == 1){
      condiciones.push(`${campo_ubigeo} = '${this.selectedDistritos[0].codigoUbigeo}'`);
    }

    const capa = this.layers.capas.filter(c => c.id == this.selectedCapa)[0];
    const nroEstados = this.selectedCapa == 1 ? this.manzana.length : this.poligonos.length;
    
    if(capa.estados.length !== nroEstados){
      const valores = capa.estados.map(v => `'${v}'`);
      const nombreCampo = this.selectedCapa == 1 ? "estado_manzana"  : "etapa";
      condiciones.push(`${nombreCampo} IN (${valores.join(',')})`)
    }
    
    if (condiciones.length === 0) {
      return '1=0';
    }

    return condiciones.join(' AND ');
  }

  onDistritosChange(next: DistritoSelected[]): void {
    // 1) guardar selección (localStorage + state)
    this.ui.setDistritos(next);
    // 2) cargar data asíncrona por ubigeo (hardcode por ahora)
    this.loadDistritosAsync(next);
  }

  // -------------------------
  // UI modal agregar/quitar
  // -
  openDistritoModal(): void {
    this.filtroDistrito = '';
    this.showDistritoModal = true;
  }

  closeDistritoModal(): void {
    this.showDistritoModal = false;
  }

  confirmAddDistritos() {
    this.showAddDistrito = false;
  }

  get distritosFiltrados(): DistritoSelected[] {
    const q = (this.filtroDistrito ?? '').trim().toLowerCase();
    if (!q) return this.allDistritos;
    return this.allDistritos.filter(d =>
      (d.distrito ?? '').toLowerCase().includes(q) ||
      (d.provincia ?? '').toLowerCase().includes(q) ||
      (d.departamento ?? '').toLowerCase().includes(q)
    );
  }

  isDistritoSelected(d: DistritoSelected): boolean {
    return this.selectedIds.has(d.idOrganizacion);
  }

  toggleDistrito(d: DistritoSelected): void {
    if (this.selectedIds.has(d.idOrganizacion)) this.selectedIds.delete(d.idOrganizacion);
    else this.selectedIds.add(d.idOrganizacion);
  }

  aplicarDistritos(): void {
    // construimos el nuevo array desde allDistritos usando selectedIds
    const next: DistritoSelected[] = this.allDistritos
      .filter(d => this.selectedIds.has(d.idOrganizacion))
      .map(d => ({
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

    // 🚀 aquí luego haces tu carga async real (manzanas/polígonos)
    this.loadDistritosAsync(next);
  }

  // -------------------------
  // capas
  // -------------------------

  toggleExpandManzana(): void {
    this.expandedManzana = !this.expandedManzana;
    if (this.expandedManzana) {
      this.expandedPoligono = false;
      this.mapService.clearCategoryLayers('po_'); // Limpia polígonos
      this.manzana.filter(m => m.checked).forEach(m => this.mapService.addLayer(m.id));
    }
  }

  toggleExpandPoligonoPanel(): void {
    this.expandedPoligono = !this.expandedPoligono;
    if (this.expandedPoligono) {
      this.expandedManzana = false;
      this.mapService.clearCategoryLayers('mz_'); // Limpia manzanas
      this.poligonos.filter(p => p.checked).forEach(p => this.mapService.addLayer(p.id));
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
    
    this.aplicarFiltros()
  }

  onToggle(item: LayerItem): void {
    item.checked = !item.checked;
    if (item.checked) this.mapService.addLayer(item.id);
    else this.mapService.removeLayer(item.id);
  }

  onOpacityChange(ev: Event): void {
    const value = Number((ev.target as HTMLInputElement).value);
    this.opacity = value;

    this.manzana.forEach(x => {
      if (x.checked) this.mapService.setOpacity(x.id, this.opacity);
    });
  }

  private loadDistritosAsync(distritos: DistritoSelected[]): void {
    console.log('Cargando data para distritos:', distritos.map(d => d.codigoUbigeo));
    setTimeout(() => {
      console.log('Data cargada OK (hardcode) ✅');
    }, 600);
  }

  cerrarDistritos() {
  // lógica para guardar distritos
  this.mostrarDiv = false; // cerrar modal
}



}
