import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as L from 'leaflet';

import { Distrito } from '../../../interfaces/Distrito';
import { DistritoSelected } from '../../../interfaces/DistritoSelected';
import { MapService } from '../../../services/map.service';
import { DistritocoordenadasService } from '../../../services/distritocoordenadas.service';

@Component({
  selector: 'app-distrito-multiselect',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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

  constructor(
    private readonly distritoCoordenadasService: DistritocoordenadasService,
    private readonly mapService: MapService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selected']) {
      this.syncLimitesOnFromSelected();
    }
  }

  private syncLimitesOnFromSelected(): void {
    this.limitesOn.clear();

    const ubigeos = (this.selected ?? [])
      .map(s => s.codigoUbigeo)
      .filter((u): u is string => !!u);

    ubigeos.forEach(u => this.limitesOn.add(u));

    // aplicar WMS al mapa cuando "selected" llega desde afuera (pantalla buscar/cargar)
    this.mapService.setDistritoBoundaries(Array.from(this.limitesOn));
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
    const ubigeo = d.codigoUbigeo;
    const isOn = this.selectedIds.has(id);

    const next = isOn
      ? (this.selected ?? []).filter(x => x.idOrganizacion !== id)
      : [...(this.selected ?? []), this.toSelected(d)];

    if (ubigeo) {
      // Mantengo tu lógica: checkbox también administra limitesOn
      if (isOn) this.limitesOn.delete(ubigeo);
      else this.limitesOn.add(ubigeo);

      this.mapService.setDistritoBoundaries(Array.from(this.limitesOn));
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
    this.mapService.setDistritoBoundaries(Array.from(this.limitesOn));
  }

  clear(): void {
    this.selectedChange.emit([]);
    this.limitesOn.clear();
    this.mapService.setDistritoBoundaries([]);
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
    ev.preventDefault();
    ev.stopPropagation();

    const ubigeo = d.codigoUbigeo;
    if (!ubigeo) return;

    const estabaOn = this.limitesOn.has(ubigeo);

    if (estabaOn) {
      // apagar límite
      this.limitesOn.delete(ubigeo);
      this.mapService.setDistritoBoundaries(Array.from(this.limitesOn));
      return;
    }

    // prender límite
    this.limitesOn.add(ubigeo);
    this.mapService.setDistritoBoundaries(Array.from(this.limitesOn));
    // llamamos tu método con un "fake" MouseEvent (solo para cumplir firma y evitar burbujas)
    this.onClickUbicarDistrito(d, ev);
  }

  isLimiteOn(ubigeo?: string | null): boolean {
    if (!ubigeo) return false;
    return this.limitesOn.has(ubigeo);
  }

  onClickUbicarDistrito(d: Distrito, ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();

    const ubigeo = d.codigoUbigeo;
    if (!ubigeo) return;

    if (this.loadingUbigeos.has(ubigeo)) return;
    this.loadingUbigeos.add(ubigeo);

    this.distritoCoordenadasService.obtenerGeometria(ubigeo).subscribe({
      next: (resp) => {
        if (!resp?.success || !resp.data) return;

        const geoString = (resp.data as any).geojson ?? (resp.data as any).geoson;
        if (!geoString) return;

        const geo = typeof geoString === 'string' ? JSON.parse(geoString) : geoString;

        const tmp = L.geoJSON(geo);
        const bounds = tmp.getBounds();

        const map = this.mapService.getMap();
        map.fitBounds(bounds, { padding: [24, 24] });
      },
      error: (e) => console.error('Error obteniendo geometría distrito:', e),
      complete: () => this.loadingUbigeos.delete(ubigeo),
    });
  }
}
