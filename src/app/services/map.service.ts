import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  private map?: L.Map| null = null;
  private overlays = new Map<string, L.Layer>();
  private poligonosSimulados = new Map<string, L.Layer>(); // Nuevo: Para polígonos

  setMap(map: L.Map) { this.map = map; }
  getMap(): L.Map { if (!this.map) throw new Error('Mapa no inicializado'); return this.map; }

  registerLayer(id: string, layer: L.Layer) { this.overlays.set(id, layer); }
  getLayer(id: string) { return this.overlays.get(id); }

  addLayer(id: string) {
    const layer = this.overlays.get(id);
    if (layer && this.map && !this.map.hasLayer(layer)) layer.addTo(this.map);
  }

  removeLayer(id: string) {
    const layer = this.overlays.get(id);
    if (layer && this.map && this.map.hasLayer(layer)) layer.remove();
  }

  // Limpia TODAS las capas de un tipo (Manzanas o Polígonos)
  clearCategoryLayers(prefix: string) {
    this.overlays.forEach((layer, id) => {
      if (id.startsWith(prefix)) this.removeLayer(id);
    });
  }

  setOpacity(id: string, opacity: number) {
    const layer = this.overlays.get(id) as any;
    if (layer?.setStyle) layer.setStyle({ opacity, fillOpacity: opacity * 0.35 });
  }

  fitToLimaDemo() { this.getMap().setView([-12.0464, -77.0428], 12); }

}
