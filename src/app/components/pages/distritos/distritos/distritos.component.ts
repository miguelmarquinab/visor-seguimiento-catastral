import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DistritosService } from '../../../../services/distritos.service';
import { Router } from '@angular/router';
import { Distrito} from '../../../../interfaces/Distrito'
import { UiStateService} from '../../../../services/ui-state.service';
import {MapaComponent} from '../../mapa/mapa.component';
import {ControlCapasComponent} from '../../control-capas/control-capas.component';
import {MatIconModule} from '@angular/material/icon';
import { MapModalReporteMapaComponent } from '../../widgets/map-modal-reporte-mapa/map-modal-reporte-mapa.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MapaComponent, ControlCapasComponent, MapModalReporteMapaComponent, MatIconModule],
  templateUrl: './distritos.component.html',
  styleUrls: ['./distritos.component.css'],
})
export class DistritosComponent implements OnInit {
  search = new FormControl('');
  items: Distrito[] = [];
  loading = false;

  private selectedMap = new Map<number, Distrito>();

  selectedIds = new Set<number>();
  constructor(private distritos: DistritosService, private router: Router, public ui: UiStateService) {

  }

  ngOnInit(): void {
    const saved = localStorage.getItem('distritos_seleccionados');
    if (saved) {
      try {
        const arr: Distrito[] = JSON.parse(saved);
        arr.forEach(d => this.selectedMap.set(d.idOrganizacion, d));
      } catch {}
    }
    this.cargar('', 0);
  }

  onBuscar(): void {
    const q = (this.search.value ?? '').trim();
    this.cargar(q, 0);
  }

  onEnter(ev: KeyboardEvent): void {
    if (ev.key === 'Enter') this.onBuscar();
  }

  toggle(d: Distrito): void {
    const id = d.idOrganizacion;
    if (this.selectedMap.has(id)) this.selectedMap.delete(id);
    else this.selectedMap.set(id, d);
  }

  isSelected(d: Distrito): boolean {
    return this.selectedMap.has(d.idOrganizacion);
  }

  get selectedCount(): number {
    return this.selectedMap.size;
  }

  agregar(): void {
    const selected = this.items.filter(x => this.selectedMap.has(x.idOrganizacion));

    if (selected.length == 0) return;

    localStorage.setItem('distritos_seleccionados', JSON.stringify(selected));
    this.ui.setDistritos(selected);
    this.ui.setView('mapa'); // <- cambia de “pantalla” en la misma página
  }

  private cargar(nombre: string, page: number): void {
    this.loading = true;
    const LIMIT_TODOS = 9999;
    this.distritos.buscar(nombre, page, LIMIT_TODOS).subscribe({
      next: (res) => {
        const orgs: Distrito[] = res?.data?.organizaciones ?? [];
        this.items = [...orgs].sort((a, b) =>
            (a.distrito ?? '').localeCompare(b.distrito ?? ''))
          //.slice(0, 6);
        //this.selectedIds.clear();
        this.loading = false;
      },
      error: () => {
        this.items = [];
        //this.selectedIds.clear();
        this.loading = false;
      },
    });
  }
}
