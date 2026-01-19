import {Component, OnInit, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService } from '../../../services/map.service';

type LayerItem = {
  id: string;
  label: string;
  checked: boolean;
};

@Component({
  selector: 'app-control-capas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './control-capas.component.html',
  styleUrl: './control-capas.component.css'
})
export class ControlCapasComponent  implements OnInit {
  @Input() embedded = false;
  expandedManzana = true;

  opacity = 1;

  // HARD CODE: capas de manzana por estado
  manzana: LayerItem[] = [
    { id: 'mz_pendiente', label: 'Pendiente', checked: true },
    { id: 'mz_levantamiento', label: 'Levantamiento', checked: true },
    { id: 'mz_edicion', label: 'Edición gráfica', checked: true },
    { id: 'mz_calidad', label: 'Control de calidad interno', checked: true },
    { id: 'mz_terminada', label: 'Terminada', checked: true },
    { id: 'mz_en_poligono', label: 'En polígono', checked: true },
  ];

  constructor(private mapService: MapService) {}

  ngOnInit() {
    // Por defecto prendemos las seleccionadas
    this.manzana.filter(x => x.checked).forEach(x => this.mapService.addLayer(x.id));
  }

  toggleExpandManzana() {
    this.expandedManzana = !this.expandedManzana;
  }

  onToggle(item: LayerItem) {
    item.checked = !item.checked;
    if (item.checked) this.mapService.addLayer(item.id);
    else this.mapService.removeLayer(item.id);
  }

  onOpacityChange(ev: Event) {
    const value = Number((ev.target as HTMLInputElement).value);
    this.opacity = value;

    // aplicar opacidad a todas las capas activas
    this.manzana.forEach(x => {
      if (x.checked) this.mapService.setOpacity(x.id, this.opacity);
    });
  }

  centerDemo() {
    this.mapService.fitToLimaDemo();
  }
}
