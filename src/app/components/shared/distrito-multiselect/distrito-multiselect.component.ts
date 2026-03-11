import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Distrito } from '../../../interfaces/Distrito';
import { DistritoSelected } from '../../../interfaces/DistritoSelected';
import { MapService } from '../../../services/map.service';
import { DistritocoordenadasService } from '../../../services/distritocoordenadas.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltip } from "@angular/material/tooltip";
import { extractDistritoGeoJson, fitGeoBounds } from '../../../utils/distrito-geo.utils';

@Component({
  selector: 'app-distrito-multiselect',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule, MatTooltip],
  templateUrl: './distrito-multiselect.component.html',
  styleUrls: ['./distrito-multiselect.component.css'],
})
export class DistritoMultiselectComponent implements OnChanges {
  @Input() all: Distrito[] = [];
  @Input() allDistritos: Distrito[] = [];
  @Input() selected: DistritoSelected[] = [];

  @Output() selectedChange = new EventEmitter<DistritoSelected[]>();

  open = false;
  search = new FormControl<string>('', { nonNullable: true });

  private readonly loadingUbigeos = new Set<string>();
  private readonly limitesOn = new Set<string>();
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    private readonly distritoCoordenadasService: DistritocoordenadasService,
    private readonly mapService: MapService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selected']) {
      this.syncLimitesOnFromSelected();
      this.cdr.markForCheck();
    }
  }

  private syncLimitesOnFromSelected(): void {
    this.limitesOn.clear();

    const ubigeos = (this.selected ?? [])
      .map(s => s.codigoUbigeo)
      .filter((u): u is string => !!u);

    ubigeos.forEach(u => this.limitesOn.add(u));

    // aplicar WMS al mapa cuando "selected" llega desde afuera (pantalla buscar/cargar)
    this.updateBoundariesOnMap();
  }

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

  /** Ubigeos seleccionados (para marcar check aunque idOrganizacion difiera entre selected y all). */
  get selectedUbigeos(): Set<string> {
    return new Set(
      (this.selected ?? [])
        .map(x => x.codigoUbigeo)
        .filter((u): u is string => !!u)
    );
  }

  /** True si el distrito está seleccionado (por id o por codigoUbigeo para sync con Manzanas/Polígonos). */
  isDistrictSelected(d: Distrito): boolean {
    return this.selectedIds.has(d.idOrganizacion) || this.selectedUbigeos.has(d.codigoUbigeo ?? '');
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
    const ubigeo = d.codigoUbigeo;
    const isOn = this.isDistrictSelected(d);

    const next = isOn
      ? (this.selected ?? []).filter(x => (x.codigoUbigeo ?? '') !== ubigeo)
      : [...(this.selected ?? []).filter(x => (x.codigoUbigeo ?? '') !== ubigeo), this.toSelected(d)];

    if (ubigeo) {
      // Mantengo tu lógica: checkbox también administra limitesOn
      if (isOn) this.limitesOn.delete(ubigeo);
      else this.limitesOn.add(ubigeo);

      this.updateBoundariesOnMap();
    }

    this.selectedChange.emit(next);
  }

  selectAllFiltered(): void {
    const map = new Map<number, DistritoSelected>(
      (this.selected ?? []).map(d => [d.idOrganizacion, d])
    );
    for (const d of this.filtered) map.set(d.idOrganizacion, this.toSelected(d));
    this.selectedChange.emit(Array.from(map.values()));

    const ubigeos = this.filtered
      .map(x => x.codigoUbigeo)
      .filter((u): u is string => !!u);

    ubigeos.forEach(u => this.limitesOn.add(u));
    this.updateBoundariesOnMap();
  }

  clear(): void {
    this.selectedChange.emit([]);
    this.limitesOn.clear();
    this.updateBoundariesOnMap();
  }

  labelSummary(): string {
    const n = this.selected?.length ?? 0;
    if (n === 0) return 'TODOS';
    if (n === 1) return this.selected[0].distrito;
    return `${n} distritos`;
  }

  isLoadingUbigeo(ubigeo?: string | null): boolean {
    if (!ubigeo) return false;
    return this.loadingUbigeos.has(ubigeo);
  }

  onToggleLimiteDistrito(d: Distrito, ev: MouseEvent): void {
    this.stopEvent(ev);

    const ubigeo = d.codigoUbigeo;
    if (!ubigeo) return;

    const estabaOn = this.limitesOn.has(ubigeo);

    if (estabaOn) {
      // apagar límite
      this.limitesOn.delete(ubigeo);
      this.updateBoundariesOnMap();
      return;
    }

    // prender límite
    this.limitesOn.add(ubigeo);
    this.updateBoundariesOnMap();
    // llamamos tu método con un "fake" MouseEvent (solo para cumplir firma y evitar burbujas)
    this.onClickUbicarDistrito(d, ev);
  }

  isLimiteOn(ubigeo?: string | null): boolean {
    if (!ubigeo) return false;
    return this.limitesOn.has(ubigeo);
  }

  onClickUbicarDistrito(d: Distrito, ev: MouseEvent): void {
    this.stopEvent(ev);

    const ubigeo = d.codigoUbigeo;
    if (!ubigeo) return;

    if (this.loadingUbigeos.has(ubigeo)) return;
    this.loadingUbigeos.add(ubigeo);

    this.distritoCoordenadasService.obtenerGeometria(ubigeo).subscribe({
      next: (resp) => {
        if (!resp?.success || !resp.data) return;

        const geo = extractDistritoGeoJson(resp.data);
        if (!geo) return;
        const map = this.mapService.getMap();
        fitGeoBounds(map, geo);
      },
      error: (e) => console.error('Error obteniendo geometría distrito:', e),
      complete: () => this.loadingUbigeos.delete(ubigeo),
    });
  }

  private stopEvent(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
  }

  private updateBoundariesOnMap(): void {
    this.mapService.setDistritoBoundaries(Array.from(this.limitesOn));
  }
}
