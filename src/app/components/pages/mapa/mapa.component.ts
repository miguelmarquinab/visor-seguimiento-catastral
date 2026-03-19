import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

import { MapService } from '../../../services/map.service';
import { UiStateService } from '../../../services/ui-state.service';
import { DemoLayersService } from '../../../services/demo-layers.service';
import { TipomapacoreService } from '../../../services/tipomapacore.service';

import { MapModalReporteManzanaComponent } from '../widgets/map-modal-reporte-manzana/map-modal-reporte-manzana.component';
import { MapModalReportePoligonoComponent } from '../widgets/map-modal-reporte-poligono/map-modal-reporte-poligono.component';

import { TipoMapainterfaz } from '../../../interfaces/TipoMapainterfaz';
import { LEVELS } from '../../../../assets/data/levels';
import { ModoFiltro } from '../../../enums/ModoFiltro';
import { MapaConteoService } from '../../../services/mapa-conteo.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [
    CommonModule,
    MapModalReporteManzanaComponent,
    MapModalReportePoligonoComponent,
  ],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css',
})
export class MapaComponent implements OnDestroy, OnInit {
  public uiService = inject(UiStateService);
  distritosSeleccionados = this.uiService.distritosSeleccionados;

  private readonly mapService = inject(MapService);
  private readonly tipoMapaService = inject(TipomapacoreService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly demoLayers = inject(DemoLayersService);
  private readonly mapaConteoService = inject(MapaConteoService);

  tipoMapa: TipoMapainterfaz[] = this.tipoMapaService.getTipoMapas();

  selectedUbigeos = computed(() =>
    this.distritosSeleccionados().map((d) => d.codigoUbigeo),
  );

  Level = LEVELS;
  escala = '';
  coordenadas = '';

  private map: L.Map | null = null;

  geometryLayer: L.FeatureGroup = L.featureGroup();

  maxBoundsLimitePeru: L.LatLngBoundsExpression = [
    [-18.34965, -81.381531],
    [-0.012393, -68.652527],
  ];

  private drawing = false;
  private drawPoints: L.LatLng[] = [];
  private tempLine?: L.Polyline;
  private previewLine?: L.Polyline;

  constructor() {
    effect(() => {
      const activo = this.uiService.drawPolygon$();

      if (activo) {
        this.cancelarDibujoPoligono();
        this.iniciarDibujoPoligono();
      } else {
        this.cancelarDibujoPoligono();
      }
    });
    effect(() => {
      const tipo = this.uiService.baseMapa$();
      if(tipo){
        this.cambiarBaseMapa(tipo);
      }
    });
  }

  ngOnInit(): void {
    this.initMapOnce();

    this.geometryLayer = L.featureGroup().addTo(this.map!);

    this.mapService.setMap(this.map!);

    this.cdr.detectChanges();

    let capaInicial = this.demoLayers.capas[0];
    this.mapService.addWmsLayer(capaInicial.workspace, capaInicial.layerName);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  iniciarDibujoPoligono() {
    if (!this.map) return;

    this.cancelarDibujoPoligono();

    this.drawing = true;
    this.drawPoints = [];

    this.map.getContainer().style.cursor = 'crosshair';
  }

  cancelarDibujoPoligono() {
    if (!this.map) return;

    this.drawing = false;
    this.drawPoints = [];

    if (this.previewLine) {
      this.map.removeLayer(this.previewLine);
      this.previewLine = undefined;
    }

    if (this.tempLine) {
      this.map.removeLayer(this.tempLine);
      this.tempLine = undefined;
    }

    this.geometryLayer.clearLayers();

    this.map.getContainer().style.cursor = '';
  }

  private initMapOnce(): void {
    if (this.map) return; // evita doble init

    this.map = L.map('map', {
      center: [-9.189967, -75.015152],
      zoom: 6,
      minZoom: 6,
      maxZoom: 23,
      maxBounds: this.maxBoundsLimitePeru,
      //layers: [baseLayer],
      crs: L.CRS.EPSG3857,
      zoomControl: true,
      attributionControl: false,
      doubleClickZoom: false,
    });

    this.mapService.setMap(this.map);

    this.map.setMaxBounds(this.maxBoundsLimitePeru);

    this.updateEscala();
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.map) return;

    this.map.on('zoomend', () => {
      this.updateEscala();
      this.cdr.detectChanges();
    });

    this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const lat = Math.round(e.latlng.lat * 100000) / 100000;
      const lng = Math.round(e.latlng.lng * 100000) / 100000;
      this.coordenadas = `Lat: ${lat}, Long: ${lng}`;
      this.cdr.detectChanges();
    });

    this.map.on('moveend', () => {
      const modo = this.uiService.modoFiltro$();  

      if (modo === ModoFiltro.AREA) {
        return;
      }
      const ubigeos = this.selectedUbigeos();
      if (ubigeos.length > 0) {
        this.mapaConteoService.actualizarConteoEstados(ubigeos);
      }
    });

    this.map.on('click', () => {
      this.removeOnlyMarker();
      this.removeOnlyPopup();
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.drawing) return;
      this.drawPoints.push(e.latlng);
    });

    this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (!this.drawing || this.drawPoints.length === 0) return;
      const previewPoints = [...this.drawPoints, e.latlng];
      if (this.previewLine) this.map!.removeLayer(this.previewLine);
      this.previewLine = L.polyline(previewPoints, {
        color: 'red',
        weight: 2,
      }).addTo(this.map!);
    }); 

    this.map.on('dblclick', (e: L.LeafletMouseEvent) => {
      if (!this.drawing || this.drawPoints.length < 3) return;

      this.drawing = false;

      if (this.previewLine) {
        this.map!.removeLayer(this.previewLine);
        this.previewLine = undefined;
      }

      const polygon = L.polygon(this.drawPoints, {
        color: '#1976d2',
        fillOpacity: 0.2,
      });

      this.geometryLayer.clearLayers();
      this.geometryLayer.addLayer(polygon);

      this.map!.getContainer().style.cursor = '';

      const latlngs = polygon.getLatLngs()[0] as L.LatLng[];

      const geojsonPolygon = {
        type: 'Polygon',
        coordinates: [latlngs.map((p) => [p.lng, p.lat])],
      };

      const first = geojsonPolygon.coordinates[0][0];
      const last = geojsonPolygon.coordinates[0].at(-1);
      if (first[0] !== last![0] || first[1] !== last![1]) {
        geojsonPolygon.coordinates[0].push(first);
      }

      this.uiService.setModoFiltro(ModoFiltro.AREA);

      this.uiService.setFiltroGeometrico(geojsonPolygon);
      
      this.mapaConteoService.actualizarConteoGeoJson(this.selectedUbigeos(), geojsonPolygon);
    });
  }

  private updateEscala(): void {
    if (!this.map) return;

    const level = this.Level.find((r: any) => r.level === this.map!.getZoom());
    if (!level) {
      this.escala = '';
      return;
    }
    this.escala =
      'Escala: 1/' + new Intl.NumberFormat('es-PE').format(level.scale);
  }

  private removeOnlyMarker(): void {
    if (!this.map) return;
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) this.map!.removeLayer(layer);
    });
  }

  private removeOnlyPopup(): void {
    if (!this.map) return;
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.Popup) this.map!.removeLayer(layer);
    });
  }

  cambiarBaseMapa(tipo:string){

    const mapa = this.tipoMapa.find(x => x.modo === tipo);
    if(!mapa) return;

    const nueva = L.tileLayer(mapa.url,{
      attribution: mapa.attribution,
      maxNativeZoom: mapa.maxNativeZoom,
      maxZoom: mapa.maxZoom,
      zIndex: mapa.zIndex
    });

    this.mapService.setBaseLayer(nueva);
  }
}
