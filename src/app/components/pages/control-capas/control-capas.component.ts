// src/app/components/pages/control-capas/control-capas.component.ts
import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MapService } from '../../../services/map.service';
import { UiStateService } from '../../../services/ui-state.service';
import { DistritosService } from '../../../services/distritos.service';

import { DistritoSelected } from '../../../interfaces/DistritoSelected';
import { DistritoMultiselectComponent } from '../../shared/distrito-multiselect/distrito-multiselect.component';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatMenuModule} from '@angular/material/menu';

type LayerItem = { id: string; label: string; checked: boolean; };

@Component({
  selector: 'app-control-capas',
  standalone: true,
  imports: [
    CommonModule,
    DistritoMultiselectComponent,
    FormsModule, MatIconModule, MatTooltipModule, MatMenuModule],
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

  manzana: LayerItem[] = [
    { id: 'mz_pendiente', label: 'Pendiente', checked: true },
    { id: 'mz_levantamiento', label: 'Levantamiento', checked: true },
    { id: 'mz_edicion', label: 'Edición gráfica', checked: true },
    { id: 'mz_calidad', label: 'Control de calidad interno', checked: true },
    { id: 'mz_terminada', label: 'Terminada', checked: true },
    { id: 'mz_en_poligono', label: 'En polígono', checked: true },
  ];

  poligonos: LayerItem[] = [
    { id: 'mz_pendiente', label: 'QA1', checked: true },
    { id: 'mz_levantamiento', label: 'QA2', checked: true },
    { id: 'mz_edicion', label: 'CIC', checked: true },
    { id: 'mz_calidad', label: 'QA3', checked: true },
    { id: 'mz_terminada', label: 'QA4', checked: true },
    { id: 'mz_en_poligono', label: 'MUNI', checked: true },
  ];

  constructor(
    private mapService: MapService,
    private ui: UiStateService,
    private distritosService: DistritosService
  ) {}

  ngOnInit(): void {
    // Prender capas por defecto
    this.manzana.filter(x => x.checked).forEach(x => this.mapService.addLayer(x.id));

    this.sub.add(
      this.ui.distritos$.subscribe((ds: DistritoSelected[]) => {
        this.selectedDistritos = ds ?? [];
      })
    );

    this.distritosService.buscar('', 0, 2000).subscribe({
      next: (res) => {
        // ✅ tu API trae data.organizaciones con el shape de DistritoSelected
        this.allDistritos = res?.data?.organizaciones ?? [];
      },
      error: () => (this.allDistritos = []),
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
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

  centerDemo(): void {
    this.mapService.fitToLimaDemo();
  }

  private loadDistritosAsync(distritos: DistritoSelected[]): void {
    console.log('Cargando data para distritos:', distritos.map(d => d.codigoUbigeo));
    setTimeout(() => {
      console.log('Data cargada OK (hardcode) ✅');
    }, 600);
  }

  toggleDiv() {
    this.mostrarDiv = !this.mostrarDiv;
  }

  cerrarDistritos() {
  // lógica para guardar distritos
  this.mostrarDiv = false; // cerrar modal
}


  
}
