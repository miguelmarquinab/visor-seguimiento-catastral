import * as L from 'leaflet';
import type { GeoJsonObject } from 'geojson';

type DistritoGeoResponseData = {
  geojson?: unknown;
  geoson?: unknown;
};

export function extractDistritoGeoJson(data: unknown): GeoJsonObject | null {
  if (!data || typeof data !== 'object') return null;

  const payload = data as DistritoGeoResponseData;
  const rawGeo = payload.geojson ?? payload.geoson;
  if (!rawGeo) return null;

  if (typeof rawGeo === 'string') {
    try {
      return JSON.parse(rawGeo);
    } catch {
      return null;
    }
  }

  if (typeof rawGeo === 'object') {
    return rawGeo as GeoJsonObject;
  }

  return null;
}

export function fitGeoBounds(map: L.Map, geo: unknown, padding: [number, number] = [24, 24]): void {
  const layer = L.geoJSON(geo as GeoJsonObject);
  const bounds = layer.getBounds();
  map.fitBounds(bounds, { padding });
}
