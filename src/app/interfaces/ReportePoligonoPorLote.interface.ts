/**
 * Contrato del endpoint "Total de Polígono por Lote".
 * GET poligono/reporteporlote?ubigeos=000000,000000
 */

/** Un registro por lote con totales por tipo de polígono (respuesta real del backend). */
export interface ReportePoligonoPorLoteItem {
  codigoLote: string;
  nombreLote: string;
  q1: number;
  q2: number;
  cic: number;
  qa3: number;
  qa4: number;
  muni: number;
}

/** Respuesta del endpoint poligono/reporteporlote. */
export interface ReportePoligonoPorLoteResponse {
  success: boolean;
  message?: string | null;
  total?: number;
  validations?: unknown;
  data: ReportePoligonoPorLoteItem[];
  type?: unknown;
}
