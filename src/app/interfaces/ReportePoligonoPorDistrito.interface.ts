/**
 * Contrato del endpoint "Total de Polígono por distrito".
 * GET poligono/reportepordistrito?ubigeos=000000,000000
 */

export interface ReportePoligonoPorDistritoItem {
  codUbigeo: string;
  distrito: string;
  q1: number;
  q2: number;
  cic: number;
  qa3: number;
  qa4: number;
  muni: number;
  totalPoligonos: number;
}

export interface ReportePoligonoPorDistritoResponse {
  success: boolean;
  message?: string | null;
  total?: number;
  validations?: unknown;
  data: ReportePoligonoPorDistritoItem[];
  type?: unknown;
}
