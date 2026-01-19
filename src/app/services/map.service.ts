import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  private map?: L.Map;
  private overlays = new Map<string, L.Layer>();

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

  hasLayer(id: string) {
    return this.overlays.has(id);
  }

  addLayer(id: string) {
    const map = this.getMap();
    const layer = this.overlays.get(id);
    if (layer && !map.hasLayer(layer)) map.addLayer(layer);
  }

  removeLayer(id: string) {
    const map = this.getMap();
    const layer = this.overlays.get(id);
    if (layer && map.hasLayer(layer)) map.removeLayer(layer);
  }

  setOpacity(id: string, opacity: number) {
    const layer = this.overlays.get(id) as any;
    // soporte para tileLayer / wms / geojson (si aplica)
    if (layer?.setOpacity) layer.setOpacity(opacity);
    if (layer?.setStyle) layer.setStyle({ opacity, fillOpacity: opacity * 0.35 });
  }

  fitToLimaDemo() {
    // demo: centro Lima
    this.getMap().setView([-12.0464, -77.0428], 12);
  }
}
