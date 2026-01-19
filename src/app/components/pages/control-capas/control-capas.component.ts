// src/app/components/pages/control-capas/control-capas.component.ts
import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { MapService } from '../../../services/map.service';
import { UiStateService } from '../../../services/ui-state.service';
import { DistritosService } from '../../../services/distritos.service';

import { DistritoSelected } from '../../../interfaces/DistritoSelected';
import { DistritoMultiselectComponent } from '../../shared/distrito-multiselect/distrito-multiselect.component';

type LayerItem = {
  id: string;
  label: string;
  checked: boolean;
};

@Component({
  selector: 'app-control-capas',
  standalone: true,
  imports: [CommonModule, DistritoMultiselectComponent],
  templateUrl: './control-capas.component.html',
  styleUrls: ['./control-capas.component.css'],
})
export class ControlCapasComponent implements OnInit, OnDestroy {
  @Input() embedded = false;

  expandedManzana = true;
  opacity = 1;

  // ✅ ambos con el MISMO tipo
  allDistritos: DistritoSelected[] = [];
  selectedDistritos: DistritoSelected[] = [];

  private sub = new Subscription();

  manzana: LayerItem[] = [
    { id: 'mz_pendiente', label: 'Pendiente', checked: true },
    { id: 'mz_levantamiento', label: 'Levantamiento', checked: true },
    { id: 'mz_edicion', label: 'Edición gráfica', checked: true },
    { id: 'mz_calidad', label: 'Control de calidad interno', checked: true },
    { id: 'mz_terminada', label: 'Terminada', checked: true },
    { id: 'mz_en_poligono', label: 'En polígono', checked: true },
  ];

  constructor(
    private mapService: MapService,
    private ui: UiStateService,
    private distritosService: DistritosService
  ) {}

  ngOnInit(): void {
    // Prender capas por defecto
    this.manzana.filter(x => x.checked).forEach(x => this.mapService.addLayer(x.id));

    // ✅ Ahora sí: el observable emite DistritoSelected[]
    this.sub.add(
      this.ui.distritos$.subscribe((ds: DistritoSelected[]) => {
        this.selectedDistritos = ds ?? [];
      })
    );

    // Cargar “todos” (hardcode / llamada grande)
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

  // ✅ el multiselect debe emitir DistritoSelected[]
  onDistritosChange(next: DistritoSelected[]): void {
    // 1) guardar selección (localStorage + state)
    this.ui.setDistritos(next);

    // 2) cargar data asíncrona por ubigeo (hardcode por ahora)
    this.loadDistritosAsync(next);
  }

  toggleExpandManzana(): void {
    this.expandedManzana = !this.expandedManzana;
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
      // aquí luego refrescas overlays de manzanas/polígonos
    }, 600);
  }
}
