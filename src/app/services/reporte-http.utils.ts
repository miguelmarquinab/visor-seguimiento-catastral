import { HttpParams } from '@angular/common/http';

type ApiListResponse<T> = {
  success?: boolean;
  data?: T[] | null;
};

type ExtraParams = Record<string, string | number | boolean | null | undefined>;

export function hasUbigeos(ubigeos: string[]): boolean {
  return Array.isArray(ubigeos) && ubigeos.length > 0;
}

export function buildUbigeosParams(ubigeos: string[], extra?: ExtraParams): HttpParams {
  let params = new HttpParams().set('ubigeos', ubigeos.join(','));
  if (!extra) return params;

  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null) {
      params = params.set(key, String(value));
    }
  }
  return params;
}

export function buildBboxParams(
  bbox: { xmin: number; ymin: number; xmax: number; ymax: number },
  ubigeos: string[]
): HttpParams {
  let params = new HttpParams()
    .set('xmin', String(bbox.xmin))
    .set('ymin', String(bbox.ymin))
    .set('xmax', String(bbox.xmax))
    .set('ymax', String(bbox.ymax));

  if (hasUbigeos(ubigeos)) {
    params = params.set('ubigeos', ubigeos.join(','));
  }
  return params;
}

export function mapSuccessArray<T>(response: ApiListResponse<T> | null | undefined): T[] {
  return response?.success && Array.isArray(response.data) ? response.data : [];
}

export function mapSuccessFirst<T>(response: ApiListResponse<T> | null | undefined): T | null {
  const rows = mapSuccessArray(response);
  return rows.length ? rows[0] : null;
}
