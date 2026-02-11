/**
 * Contrato del endpoint "Total de unidades por polígono" (unidades catastrales por estado).
 * GET unidadcatastral/reporteporestado?ubigeos=000000,000000
 */

export interface ReporteUnidadCatastralPorEstadoItem {
  totalUc: number;
  ucQa1: number;
  ucQa2: number;
  ucCic: number;
  ucQa3: number;
  ucQa4: number;
  ucMuni: number;
  /** Total UC en estado 1 (Pendientes). */
  estadoUc01: number;
  /** Total UC en estado 2 (En proceso). */
  estadoUc02: number;
  /** Total UC en estado 3 (Terminado). */
  estadoUc03: number;
  pctUcQa1: number;
  pctUcQa2: number;
  pctUcCic: number;
  pctUcQa3: number;
  pctUcQa4: number;
  pctUcMuni: number;
}

export interface ReporteUnidadCatastralPorEstadoResponse {
  success: boolean;
  message?: string | null;
  total?: number;
  validations?: unknown;
  data: ReporteUnidadCatastralPorEstadoItem[];
  type?: unknown;
}
