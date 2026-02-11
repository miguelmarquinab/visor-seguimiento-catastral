/**
 * Contrato del endpoint: GET manzana/reportepordistrito?ubigeos=000000,000000
 * Un registro por distrito con totales por estado (estado01..estado06 = Pendiente, Levantamiento, Edición, Calidad, Terminada, En polígono).
 */

export interface ReporteManzanaPorDistritoItem {
  codUbigeo: string;
  distrito: string;
  estado01: number;
  estado02: number;
  estado03: number;
  estado04: number;
  estado05: number;
  estado06: number;
  totalManzanas: number;
}

export interface ReporteManzanaPorDistritoResponse {
  success: boolean;
  message?: string | null;
  total?: number;
  validations?: unknown;
  data: ReporteManzanaPorDistritoItem[];
  type?: unknown;
}
