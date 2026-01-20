import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {FormControl,  FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Distrito } from '../../../interfaces/Distrito';
import { DistritoSelected } from '../../../interfaces/DistritoSelected';

@Component({
  selector: 'app-distrito-multiselect',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './distrito-multiselect.component.html',
  styleUrls: ['./distrito-multiselect.component.css'],
})
export class DistritoMultiselectComponent {
  @Input() all: Distrito[] = [];
  // TODOS los distritos (vienen del backend)
  @Input() allDistritos: Distrito[] = [];
  // seleccionados actuales (vienen del UiStateService)
  @Input() selected: DistritoSelected[] = [];

  // Output propio: emite la nueva selección
  @Output() selectedChange = new EventEmitter<DistritoSelected[]>();

  filtroDistrito = '';


  open = false;
  search = new FormControl<string>('', { nonNullable: true });

  private toSelected(d: Distrito): DistritoSelected {
    return {
      idOrganizacion: d.idOrganizacion,
      codigoUbigeo: d.codigoUbigeo,
      distrito: d.distrito,
      provincia: d.provincia,
      departamento: d.departamento,
      nombreOrganizacion: d.nombreOrganizacion,
      logo: d.logo ?? null,
    };
  }

  get selectedIds(): Set<number> {
    return new Set((this.selected ?? []).map(x => x.idOrganizacion));
  }

  get filtered(): Distrito[] {
    const q = this.search.value.trim().toLowerCase();
    const base = this.all ?? [];
    if (!q) return base;

    return base.filter(d =>
      (d.distrito ?? '').toLowerCase().includes(q) ||
      (d.departamento ?? '').toLowerCase().includes(q) ||
      (d.provincia ?? '').toLowerCase().includes(q) ||
      (d.codigoUbigeo ?? '').toLowerCase().includes(q) ||
      (d.nombreOrganizacion ?? '').toLowerCase().includes(q)
    );
  }

  toggleOpen(): void {
    this.open = !this.open;
    if (this.open) this.search.setValue('');
  }

  toggleDistrict(d: Distrito): void {
    const id = d.idOrganizacion;
    const isOn = this.selectedIds.has(id);

    const next = isOn
      ? (this.selected ?? []).filter(x => x.idOrganizacion !== id)
      : [...(this.selected ?? []), this.toSelected(d)];

    this.selectedChange.emit(next);
  }

  selectAllFiltered(): void {
    const map = new Map<number, DistritoSelected>((this.selected ?? []).map(d => [d.idOrganizacion, d]));
    for (const d of this.filtered) map.set(d.idOrganizacion, this.toSelected(d));
    this.selectedChange.emit(Array.from(map.values()));
  }

  clear(): void {
    this.selectedChange.emit([]);
  }

  labelSummary(): string {
    const n = this.selected?.length ?? 0;
    if (n === 0) return 'TODOS';
    if (n === 1) return this.selected[0].distrito;
    return `${n} distritos`;
  }
}
