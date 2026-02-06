/**
 * Contrato del endpoint "Total de Polígonos" (reporte por estado).
 * GET poligono/reporteporestado?ubigeos=000000,000000
 */

export interface ReportePoligonoPorEstadoItem {
  totalPoligonos: number;
  q1: number;
  q2: number;
  cic: number;
  qa3: number;
  qa4: number;
  muni: number;
  /** Total en estado 1 (Pendientes). */
  estado01: number;
  /** Total en estado 2 (En proceso). */
  estado02: number;
  /** Total en estado 3 (Terminado). */
  estado03: number;
  pctQ1: number;
  pctQ2: number;
  pctCic: number;
  pctQa3: number;
  pctQa4: number;
  pctMuni: number;
}

export interface ReportePoligonoPorEstadoResponse {
  success: boolean;
  message?: string | null;
  total?: number;
  validations?: unknown;
  data: ReportePoligonoPorEstadoItem[];
  type?: unknown;
}
