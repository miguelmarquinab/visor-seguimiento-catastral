import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable} from 'rxjs';
import { TipoMapainterfaz} from '../interfaces/TipoMapainterfaz';

@Injectable({
  providedIn: 'root'
})
export class TipomapacoreService {
  getTipoMapas(): TipoMapainterfaz[] {
    return [
      {
        modo: 'Satelital',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxNativeZoom: 19,
        maxZoom: 23,
        zIndex: 1
      },
      {
        modo: 'OSM',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxNativeZoom: 19,
        maxZoom: 23,
        zIndex: 1
      }
    ];
  }
}
