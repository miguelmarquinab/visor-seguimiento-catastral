import { Injectable, inject } from '@angular/core';
import { MapService } from './map.service';
import { UiStateService } from './ui-state.service';
import { ManzanaReporteService } from './manzana-reporte.service';
import { PoligonoReporteService } from './poligono-reporte.service';

@Injectable({
  providedIn: 'root',
})
export class MapaConteoService {
  private readonly mapService = inject(MapService);
  private readonly uiService = inject(UiStateService);
  private readonly manzanaService = inject(ManzanaReporteService);
  private readonly poligonoService = inject(PoligonoReporteService);

  actualizarConteoEstados(ubigeos: string[]) {
    const coords = this.mapService.getBoundsCoords();
    const panel = this.uiService.panelActivo();

    if (panel === 'manzana') {
      this.manzanaService
        .getConteoEstados(coords, ubigeos)
        .subscribe((data: any) => {
          this.uiService.updateConteoManzanas(data);
        });
    }

    if (panel === 'poligono') {
      this.poligonoService
        .getConteoEstados(coords, ubigeos)
        .subscribe((data: any) => {
          this.uiService.updateConteoPoligonos(data);
        });
    }
  }
  actualizarConteoGeoJson(ubigeos: string[], geojson: any) {
    const panel = this.uiService.panelActivo();

    if (panel === 'manzana') {
      this.manzanaService
        .getConteoGeoJson(ubigeos, geojson)
        .subscribe((data) => this.uiService.updateConteoManzanas(data));
    }

    if (panel === 'poligono') {
      this.poligonoService
        .getConteoGeoJson(ubigeos, geojson)
        .subscribe((data) => this.uiService.updateConteoPoligonos(data));
    }
  }
}
