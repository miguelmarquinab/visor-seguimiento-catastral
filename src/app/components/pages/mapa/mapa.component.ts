import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

import { MapService } from '../../../services/map.service';
import { UiStateService } from '../../../services/ui-state.service';

import { MapModalReporteManzanaComponent } from '../widgets/map-modal-reporte-manzana/map-modal-reporte-manzana.component';
import { MapModalReportePoligonoComponent } from '../widgets/map-modal-reporte-poligono/map-modal-reporte-poligono.component';

import { TipoMapainterfaz } from '../../../interfaces/TipoMapainterfaz';
import { TipomapacoreService } from '../../../services/tipomapacore.service';

import { LEVELS } from '../../../../assets/data/levels';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [
    CommonModule,
    MapModalReporteManzanaComponent,
    MapModalReportePoligonoComponent
  ],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent implements AfterViewInit, OnDestroy {
  private map: L.Map | null = null;

  public uiService = inject(UiStateService);

  private readonly mapService = inject(MapService);
  private readonly tipoMapaService = inject(TipomapacoreService);
  private readonly cdr = inject(ChangeDetectorRef);

  tipoMapa: TipoMapainterfaz[] = this.tipoMapaService.getTipoMapas();

  Level = LEVELS;
  escala = '';
  coordenadas = '';

  geometryLayer: L.FeatureGroup = L.featureGroup();

  maxBoundsLimitePeru: L.LatLngBoundsExpression = [
    [-18.34965, -81.381531],
    [-0.012393, -68.652527]
  ];

  ngAfterViewInit(): void {
    this.initMapOnce();

    // capas auxiliares
    this.geometryLayer = L.featureGroup().addTo(this.map!);

    // para que otros servicios puedan usar el mapa
    this.mapService.setMap(this.map!);

    // ✅ importante para evitar NG0100 (Angular ya chequeó el template)
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private initMapOnce(): void {
    if (this.map) return; // evita doble init

    const satellite = this.tipoMapa.find(x => x.modo === 'Satelital') ?? this.tipoMapa[0];

    const baseLayer = L.tileLayer(satellite.url, {
      attribution: satellite.attribution,
      maxNativeZoom: satellite.maxNativeZoom,
      maxZoom: satellite.maxZoom,
      zIndex: satellite.zIndex
    });

    this.map = L.map('map', {
      center: [-9.189967, -75.015152],
      zoom: 6,
      minZoom: 6,
      maxZoom: 23,
      maxBounds: this.maxBoundsLimitePeru,
      layers: [baseLayer],
      crs: L.CRS.EPSG3857,
      zoomControl: true,
      attributionControl: false
    });

    this.map.setMaxBounds(this.maxBoundsLimitePeru);

    // set inicial (esto cambia bindings, por eso detectChanges arriba)
    this.updateEscala();
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.map) return;

    this.map.on('zoomend', () => {
      this.updateEscala();
      // ✅ forzar actualización segura cuando Leaflet dispara eventos fuera del ciclo Angular
      this.cdr.detectChanges();
    });

    this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const lat = Math.round(e.latlng.lat * 100000) / 100000;
      const lng = Math.round(e.latlng.lng * 100000) / 100000;
      this.coordenadas = `Lat: ${lat}, Long: ${lng}`;
      this.cdr.detectChanges();
    });

    this.map.on('click', () => {
      this.removeOnlyMarker();
      this.removeOnlyPopup();
    });
  }

  private updateEscala(): void {
    if (!this.map) return;

    const level = this.Level.find((r: any) => r.level === this.map!.getZoom());
    if (!level) {
      this.escala = '';
      return;
    }

    this.escala = 'Escala: 1/' + new Intl.NumberFormat('es-PE').format(level.scale);
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
}
