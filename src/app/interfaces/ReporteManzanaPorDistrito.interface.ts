/**
 * Respuesta del endpoint: GET manzana/reportepordistrito?ubigeos=[,]
 * Para el gráfico "Estado de Manzanas por distrito" (stacked bar).
 */
export interface ReporteManzanaPorDistritoSerie {
  name: string;
  stack: string;
  data: number[];
  color: string;
}

export interface ReporteManzanaPorDistritoData {
  categorias: string[];
  series: ReporteManzanaPorDistritoSerie[];
  leyenda: string[];
}

export interface ReporteManzanaPorDistritoResponse {
  success: boolean;
  message: string | null;
  total: number;
  validations: unknown;
  data: ReporteManzanaPorDistritoData | null;
  type: unknown;
}
