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
      },
      {
        modo:'Topo',
        url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },

      {
        modo:'140101',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Chiclayo/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },

      {
        modo:'140105',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/JoseLeonardoOrtiz/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },

      {
        modo:'140105',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/JoseLeonardoOrtiz/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },

      {
        modo:'140106',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/LaVictoria/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },

      {
        modo:'140112',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Pimentel/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },

      {
        modo:'140301',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Lambayeque/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150105',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Brenia/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150108',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Chorrillos/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150110',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Comas/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150111',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/ElAgustino/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150112',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Independencia/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150117',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/LosOlivos/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150133',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/SanJuanMiraflores/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150134',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/SanLuis/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150101',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Lima/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150135',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/SanMartinPorres/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150136',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/SanMiguel/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150141',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Surquillo/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'150142',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/VillaSalvador/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'200101',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Piura/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'200104',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Castilla/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'200105',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/Catacaos/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      },
      {
        modo:'200115',
        url:'https://vuelos.ue003cofopri.gob.pe/vuelos/26Octubre/{z}/{x}/{y}.png',
        attribution:'',
        maxNativeZoom:19,
        maxZoom:23,
        zIndex: 0
      }
    ];
  }
}
