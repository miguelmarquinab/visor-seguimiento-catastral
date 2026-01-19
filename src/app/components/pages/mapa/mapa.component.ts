import { Component } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from '../../../services/map.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent {

  private map?: L.Map;

  constructor(private mapService: MapService) {}

  ngAfterViewInit(): void {
    this.map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([-12.0464, -77.0428], 12);

    // Base map (temporal). Luego lo cambiamos a Google si tienes API key.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    this.mapService.setMap(this.map);

    // Hardcode demo layers (cuadrados)
    this.createDemoLayers();
  }

  private createDemoLayers() {
    // Simulamos “Manzana: Pendiente / Levantamiento / etc”
    // Solo para probar: polígonos de colores alrededor de Lima

    const layers: Array<{ id: string; coords: [number, number][] }> = [
      { id: 'mz_pendiente', coords: [[-12.05,-77.08],[-12.05,-77.06],[-12.035,-77.06],[-12.035,-77.08]] },
      { id: 'mz_levantamiento', coords: [[-12.07,-77.06],[-12.07,-77.04],[-12.055,-77.04],[-12.055,-77.06]] },
      { id: 'mz_edicion', coords: [[-12.03,-77.05],[-12.03,-77.03],[-12.015,-77.03],[-12.015,-77.05]] },
      { id: 'mz_calidad', coords: [[-12.055,-77.03],[-12.055,-77.01],[-12.04,-77.01],[-12.04,-77.03]] },
      { id: 'mz_terminada', coords: [[-12.08,-77.08],[-12.08,-77.065],[-12.065,-77.065],[-12.065,-77.08]] },
      { id: 'mz_en_poligono', coords: [[-12.04,-77.095],[-12.04,-77.085],[-12.03,-77.085],[-12.03,-77.095]] },
    ];

    // colores hardcode (solo demo)
    const styleMap: Record<string, any> = {
      mz_pendiente: { color: '#f2c94c', weight: 2, fillColor: '#f2c94c', fillOpacity: 0.35 },
      mz_levantamiento: { color: '#2d9cdb', weight: 2, fillColor: '#2d9cdb', fillOpacity: 0.35 },
      mz_edicion: { color: '#9b51e0', weight: 2, fillColor: '#9b51e0', fillOpacity: 0.35 },
      mz_calidad: { color: '#f2994a', weight: 2, fillColor: '#f2994a', fillOpacity: 0.35 },
      mz_terminada: { color: '#27ae60', weight: 2, fillColor: '#27ae60', fillOpacity: 0.35 },
      mz_en_poligono: { color: '#eb5757', weight: 2, fillColor: '#eb5757', fillOpacity: 0.35 },
    };

    layers.forEach((l) => {
      const poly = L.polygon(l.coords as any, styleMap[l.id]);
      this.mapService.registerLayer(l.id, poly);
      // por defecto NO agregamos al mapa, se agregan desde el panel
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

}
