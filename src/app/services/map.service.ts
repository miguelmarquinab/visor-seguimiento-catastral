import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private map?: L.Map | null = null;
  private readonly overlays = new Map<string, L.Layer>();
  private readonly poligonosSimulados = new Map<string, L.Layer>(); // (lo tienes, lo dejo)
  private readonly urlGeoserver: string = environment.urlGeoserver;

  public selectedLayer?: L.TileLayer.WMS;

  private readonly DISTRITO_WMS_ID = 'distrito-boundaries';

  setMap(map: L.Map) {
    this.map = map;
  }
  getMap(): L.Map {
    if (!this.map) throw new Error('Mapa no inicializado');
    return this.map;
  }

  registerLayer(id: string, layer: L.Layer) {
    this.overlays.set(id, layer);
  }
  getLayer(id: string) {
    return this.overlays.get(id);
  }

  addLayer(id: string) {
    const layer = this.overlays.get(id);
    if (layer && this.map && !this.map.hasLayer(layer)) layer.addTo(this.map);
  }

  addWmsLayer(
    workspace: string,
    nombre: string,
    filtro?: string,
    zIndex?: number,
  ) {
    const url = `${this.urlGeoserver}/${workspace}/wms`;

    const wmsOptions: any = {
      layers: `${workspace}:${nombre}`,
      format: 'image/png',
      transparent: true,
      maxNativeZoom: 22,
      maxZoom: 22,
      cql_filter: filtro ?? '',
      zIndex: zIndex,
    };

    this.selectedLayer = L.tileLayer.wms(url, wmsOptions);
    this.selectedLayer.addTo(this.getMap());
  }

  removeLayer(id: string) {
    const layer = this.overlays.get(id);
    if (layer && this.map && this.map.hasLayer(layer)) layer.remove();
  }

  removeLayerAndUnregister(id: string) {
    this.removeLayer(id);
    this.overlays.delete(id);
  }

  clearCategoryLayers(prefix: string) {
    this.overlays.forEach((layer, id) => {
      if (id.startsWith(prefix)) {
        this.removeLayer(id);
        this.overlays.delete(id);
      }
    });
  }

  setOpacity(id: string, opacity: number) {
    const layer = this.overlays.get(id) as any;
    if (layer?.setStyle)
      layer.setStyle({ opacity, fillOpacity: opacity * 0.35 });
  }

  fitToLimaDemo() {
    this.getMap().setView([-12.0464, -77.0428], 12);
  }

  hasSelectedWms(): boolean {
    if (!this.selectedLayer) return false;
    const map = this.getMap();
    return map.hasLayer(this.selectedLayer);
  }

  removeSelectedWmsLayer(): void {
    if (!this.selectedLayer) return;
    const map = this.getMap();

    if (map.hasLayer(this.selectedLayer)) {
      map.removeLayer(this.selectedLayer);
    }
    this.selectedLayer = undefined;
  }

  setDistritoBoundaries(
    ubigeos: string[],
    workspace: string = 'dashboard',
    layerName: string = 'tg_distrito',
  ): void {
    if (!ubigeos || ubigeos.length === 0) {
      this.removeLayerAndUnregister(this.DISTRITO_WMS_ID);
      return;
    }

    const url = `${this.urlGeoserver}/${workspace}/wms`;
    const cql = `cod_ubigeo IN (${ubigeos.map((u) => `'${u}'`).join(',')})`;

    const existing = this.getLayer(this.DISTRITO_WMS_ID) as any;

    if (existing && typeof existing.setParams === 'function') {
      existing.setParams({ cql_filter: cql }, false);
      if (typeof existing.redraw === 'function') existing.redraw();
      return;
    }

    const wmsOptions: any = {
      layers: `${workspace}:${layerName}`,
      format: 'image/png',
      transparent: true,
      maxNativeZoom: 22,
      maxZoom: 22,
      cql_filter: cql,
    };

    const wms = L.tileLayer.wms(url, wmsOptions);
    this.registerLayer(this.DISTRITO_WMS_ID, wms);
    this.addLayer(this.DISTRITO_WMS_ID);
  }

  sectorLayer: any;
  addSectorLayer(
    workspace: string,
    nombre: string,
    filtro?: string,
    zIndex?: number,
  ) {
    const url = `${this.urlGeoserver}/${workspace}/wms`;

    const options: any = {
      layers: `${workspace}:${nombre}`,
      format: 'image/png',
      transparent: true,
      cql_filter: filtro ?? '',
      zIndex: zIndex,
    };

    this.sectorLayer = L.tileLayer.wms(url, options);
    this.sectorLayer.addTo(this.getMap());
  }

  removeSectorLayer() {
    if (this.sectorLayer) {
      this.getMap().removeLayer(this.sectorLayer);
      this.sectorLayer = undefined;
    }
  }
}
