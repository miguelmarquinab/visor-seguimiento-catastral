import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DistritosService } from '../../../../services/distritos.service';
import { Router } from '@angular/router';
import { Distrito} from '../../../../interfaces/Distrito'
import { UiStateService} from '../../../../services/ui-state.service';
import {MapaComponent} from '../../mapa/mapa.component';
import {ControlCapasComponent} from '../../control-capas/control-capas.component';
import {MenuComponent} from '../../../shared/menu/menu.component';

@Component({
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    MapaComponent,
    ControlCapasComponent,
    MenuComponent],
  templateUrl: './distritos.component.html',
  styleUrls: ['./distritos.component.css'],
})
export class DistritosComponent implements OnInit {
  search = new FormControl('');
  items: Distrito[] = [];
  loading = false;

  selectedIds = new Set<number>();
  constructor(private distritos: DistritosService, private router: Router, public ui: UiStateService) {

  }

  ngOnInit(): void {
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
    if (this.selectedIds.has(d.idOrganizacion)) this.selectedIds.delete(d.idOrganizacion);
    else this.selectedIds.add(d.idOrganizacion);
  }

  isSelected(d: Distrito): boolean {
    return this.selectedIds.has(d.idOrganizacion);
  }

  agregar(): void {
    const selected = this.items.filter(x => this.selectedIds.has(x.idOrganizacion));
    localStorage.setItem('distritos_seleccionados', JSON.stringify(selected));

    if (selected.length == 0) return;

    this.ui.setDistritos(selected);
    this.ui.setView('mapa'); // <- cambia de “pantalla” en la misma página

    //this.router.navigateByUrl('/mapa');
  }

  volverASeleccion(): void {
    this.ui.setView('distritos');
  }

  private cargar(nombre: string, page: number): void {
    this.loading = true;
    this.distritos.buscar(nombre, page, 6).subscribe({
      next: (res) => {
        const orgs: Distrito[] = res?.data?.organizaciones ?? [];
        this.items = [...orgs]
          .sort((a, b) => (a.distrito ?? '').localeCompare(b.distrito ?? ''))
          .slice(0, 6);
        this.selectedIds.clear();
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.selectedIds.clear();
        this.loading = false;
      },
    });
  }
}
