import {CommonModule} from '@angular/common';
import { Component, EventEmitter, Input, Output} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Distrito } from '../../../interfaces/Distrito';

@Component({
  selector: 'app-distrito-multiselect',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './distrito-multiselect.component.html',
  styleUrl: './distrito-multiselect.component.css'
})
export class DistritoMultiselectComponent {
  @Input() all: Distrito[] = [];
  @Input() selected: Distrito[] = [];

  @Output() selectedChange = new EventEmitter<Distrito[]>();

  open = false;
  search = new FormControl<string>('', { nonNullable: true });

  get selectedIds(): Set<number> {
    return new Set(this.selected.map(x => x.idOrganizacion));
  }

  get filtered(): Distrito[] {
    const q = this.search.value.trim().toLowerCase();
    const base = this.all ?? [];
    if (!q) return base;

    return base.filter(d =>
      (d.distrito ?? '').toLowerCase().includes(q) ||
      (d.departamento ?? '').toLowerCase().includes(q) ||
      (d.provincia ?? '').toLowerCase().includes(q) ||
      (d.codigoUbigeo ?? '').toLowerCase().includes(q)
    );
  }

  toggleOpen(): void {
    this.open = !this.open;
    if (this.open) this.search.setValue('');
  }

  toggleDistrict(d: Distrito): void {
    const set = this.selectedIds;
    const isOn = set.has(d.idOrganizacion);

    const next = isOn
      ? this.selected.filter(x => x.idOrganizacion !== d.idOrganizacion)
      : [...this.selected, d];
    this.selectedChange.emit(next);
  }

  selectAllFiltered(): void {
    const set = new Map(this.selected.map(d => [d.idOrganizacion, d]));
    for (const d of this.filtered) set.set(d.idOrganizacion, d);
    this.selectedChange.emit(Array.from(set.values()));
  }

  clear(): void {
    this.selectedChange.emit([]);
  }

  labelSummary(): string {
    const n = this.selected?.length ?? 0;
    if (n === 0) return 'TODOS (ninguno seleccionado)';
    if (n === 1) return this.selected[0].distrito;
    return `${n} distritos seleccionados`;
  }

}
