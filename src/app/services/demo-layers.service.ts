import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from './map.service';


@Injectable({ providedIn: 'root' })
export class DemoLayersService {

  private initialized = false;

  constructor(private readonly mapService: MapService) {}

  capas = [
    {
      id: 1,
      descripcion: "Manzana",
      estados: ['01', '02', '03', '04', '05', '06'],
      workspace: "dashboard",
      layerName: "dashboard_manzanas"
    },
    {
      id: 2,
      descripcion: "Polígono",
      estados: ['QA1', 'QA2', 'CIC', 'QA3', 'QA4', 'MUNI'],
      workspace: "dashboard",
      layerName: "dashboard_poligonos"
    },
  ]

  updatLayer(filter: string): void {
    this.mapService.selectedLayer!.setParams({ cql_filter: filter } as any);
  }

  initOnce(map: L.Map): void {
    if (this.initialized) return;
    this.initialized = true;

    // ---- MANZANAS (mz_*) ----
    this.registerPolygon(map, 'mz_pendiente', [
      [-12.08, -77.12],
      [-12.08, -77.08],
      [-12.05, -77.08],
      [-12.05, -77.12],
    ]);

    this.registerPolygon(map, 'mz_levantamiento', [
      [-12.06, -77.06],
      [-12.06, -77.02],
      [-12.03, -77.02],
      [-12.03, -77.06],
    ]);

    this.registerPolygon(map, 'mz_edicion', [
      [-12.12, -77.06],
      [-12.12, -77.02],
      [-12.09, -77.02],
      [-12.09, -77.06],
    ]);

    this.registerPolygon(map, 'mz_calidad', [
      [-11.98, -77.1],
      [-11.98, -77.06],
      [-11.95, -77.06],
      [-11.95, -77.1],
    ]);

    this.registerPolygon(map, 'mz_terminada', [
      [-12.01, -77.16],
      [-12.01, -77.12],
      [-11.98, -77.12],
      [-11.98, -77.16],
    ]);

    this.registerPolygon(map, 'mz_en_poligono', [
      [-12.14, -77.16],
      [-12.14, -77.12],
      [-12.11, -77.12],
      [-12.11, -77.16],
    ]);

    // ---- POLIGONOS (po_*) ----
    this.registerPolygon(map, 'po_qa1', [
      [-12.3, -77.4],
      [-12.3, -77.1],
      [-12.05, -77.1],
      [-12.05, -77.4],
    ], { weight: 4, fillOpacity: 0.15 });

    this.registerPolygon(map, 'po_qa2', [
      [-12.05, -77.4],
      [-12.05, -77.1],
      [-11.8, -77.1],
      [-11.8, -77.4],
    ], { weight: 4, fillOpacity: 0.15 });

    this.registerPolygon(map, 'po_cic', [
      [-12.3, -77.1],
      [-12.3, -76.8],
      [-12.05, -76.8],
      [-12.05, -77.1],
    ], { weight: 4, fillOpacity: 0.15 });

    this.registerPolygon(map, 'po_qa3', [
      [-12.05, -77.1],
      [-12.05, -76.8],
      [-11.8, -76.8],
      [-11.8, -77.1],
    ], { weight: 4, fillOpacity: 0.15 });

    this.registerPolygon(map, 'po_qa4', [
      [-12.3, -76.8],
      [-12.3, -76.5],
      [-12.05, -76.5],
      [-12.05, -76.8],
    ], { weight: 4, fillOpacity: 0.15 });

    this.registerPolygon(map, 'po_muni', [
      [-12.05, -76.8],
      [-12.05, -76.5],
      [-11.8, -76.5],
      [-11.8, -76.8],
    ], { weight: 4, fillOpacity: 0.15 });
  }

  private registerPolygon(
    map: L.Map,
    id: string,
    latlngs: L.LatLngExpression[],
    styleOverrides: L.PathOptions = {}
  ): void {
    const isManzana = id.startsWith('mz_');

    const style: L.PathOptions = isManzana
      ? { weight: 2, fillOpacity: 0.35, ...styleOverrides }
      : { weight: 4, fillOpacity: 0.15, ...styleOverrides };

    const layer = L.polygon(latlngs, style);

    layer.bindTooltip(id, { sticky: true });

    // Registramos para que ControlCapas lo prenda/apague por id
    this.mapService.registerLayer(id, layer);

    // Importante: NO lo agregamos al map aquí
    // (porque el usuario decide con checkboxes)
  }
}
