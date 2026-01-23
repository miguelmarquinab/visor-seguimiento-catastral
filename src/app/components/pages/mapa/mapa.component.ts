import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import * as L from 'leaflet';
import { MapService } from '../../../services/map.service'
import { UiStateService } from '../../../services/ui-state.service'; // Importa tu servicio
import {MapModalReporteMapaComponent} from '../widgets/map-modal-reporte-mapa/map-modal-reporte-mapa.component';
import { MapModalReporteManzanaComponent} from '../widgets/map-modal-reporte-manzana/map-modal-reporte-manzana.component';
import {MapModalReportePoligonoComponent} from '../widgets/map-modal-reporte-poligono/map-modal-reporte-poligono.component';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule,
    MapModalReporteMapaComponent,
    MapModalReporteManzanaComponent,
    MapModalReportePoligonoComponent
  ],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent {

  private map?: L.Map;
  public uiService = inject(UiStateService);

  public showStats = signal(false);

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

    this.uiService.categorySelected$.subscribe(category => {
      this.filtrarMapa(category);
    })
  }

  filtrarMapa(categoria: string | null) {
    const categoriasMap: Record<string, string> = {
      'Pendiente': 'mz_pendiente',
      'Levantamiento': 'mz_levantamiento',
      'Edición gráfica': 'mz_edicion',
      'Control de calidad interno': 'mz_calidad',
      'Terminada': 'mz_terminada',
      'En polígono': 'mz_en_poligono'
    };

    Object.keys(categoriasMap).forEach(key => {
      const layerId = categoriasMap[key];
      const layer = this.mapService.getLayer(layerId); // Asegúrate de tener este método en tu MapService

      if (layer) {
        if (!categoria || categoria === key) {
          layer.addTo(this.map!); // Mostrar si coincide o si no hay filtro
        } else {
          layer.remove(); // Ocultar si no coincide con el clic
        }
      }
    });
  }

  private createDemoLayers() {
    const mzLayers = [
      { id: 'mz_pendiente', coords: [[-12.05, -77.08], [-12.05, -77.06], [-12.035, -77.06], [-12.035, -77.08]], color: '#f2c94c' },
      { id: 'mz_levantamiento', coords: [[-12.07, -77.06], [-12.07, -77.04], [-12.055, -77.04], [-12.055, -77.06]], color: '#2d9cdb' },
      { id: 'mz_edicion', coords: [[-12.03,-77.05],[-12.03,-77.03],[-12.015,-77.03],[-12.015,-77.05]] },
      { id: 'mz_calidad', coords: [[-12.055,-77.03],[-12.055,-77.01],[-12.04,-77.01],[-12.04,-77.03]] },
      { id: 'mz_terminada', coords: [[-12.08,-77.08],[-12.08,-77.065],[-12.065,-77.065],[-12.065,-77.08]] },
      { id: 'mz_en_poligono', coords: [[-12.04,-77.095],[-12.04,-77.085],[-12.03,-77.085],[-12.03,-77.095]] },
      // ... resto de manzanas con mz_
    ];

    const poLayers = [
      { id: 'po_qa1', coords: [[-12.01, -77.05], [-12.01, -77.02], [-11.99, -77.02], [-11.99, -77.05]], color: '#1E3A8A' },
      { id: 'po_qa2', coords: [[-12.04, -77.03], [-12.04, -77.01], [-12.02, -77.01], [-12.02, -77.03]], color: '#F97316' },
      // Simulando otros sectores
      { id: 'po_cic', coords: [[-12.08, -77.03], [-12.08, -77.01], [-12.06, -77.01], [-12.06, -77.03]], color: '#94A3B8' },
    ];

    mzLayers.forEach(l => {
      const p = L.polygon(l.coords as any, { color: l.color, fillColor: l.color, fillOpacity: 0.35 });
      this.mapService.registerLayer(l.id, p);
    });

    poLayers.forEach(l => {
      const p = L.polygon(l.coords as any, { color: l.color, weight: 4, fillColor: l.color, fillOpacity: 0.5 });
      this.mapService.registerLayer(l.id, p);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

}
