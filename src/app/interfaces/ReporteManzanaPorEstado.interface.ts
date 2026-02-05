/**
 * Respuesta cruda del endpoint: GET manzana/reporteporestado?ubigeo=...
 * estado01 => pendiente, estado02 => levantamiento, estado03 => edicion,
 * estado04 => calidad, estado05 => terminada, estado06 => poligono
 */
export interface ReporteManzanaPorEstadoItem {
  totalManzanas: number;
  estado01: number;
  estado02: number;
  estado03: number;
  estado04: number;
  estado05: number;
  estado06: number;
  pct01: number;
  pct02: number;
  pct03: number;
  pct04: number;
  pct05: number;
  pct06: number;
}

export interface ReporteManzanaPorEstadoResponse {
  success: boolean;
  message: string | null;
  total: number;
  validations: unknown;
  data: ReporteManzanaPorEstadoItem[];
  type: unknown;
}

/** Mapeo para uso en UI (estado API -> nombre legible) */
export const ESTADO_MANZANA_LABELS: Record<keyof Pick<ReporteManzanaPorEstadoItem,
  'estado01' | 'estado02' | 'estado03' | 'estado04' | 'estado05' | 'estado06'>, string> = {
  estado01: 'Pendiente',
  estado02: 'Levantamiento',
  estado03: 'Edición gráfica',
  estado04: 'Control de calidad Int',
  estado05: 'Terminada',
  estado06: 'En polígono'
};

export interface ManzanaReportePorEstadoMapeado {
  totalManzanas: number;
  pendiente: number;
  levantamiento: number;
  edicion: number;
  calidad: number;
  terminada: number;
  poligono: number;
  pctPendiente: number;
  pctLevantamiento: number;
  pctEdicion: number;
  pctCalidad: number;
  pctTerminada: number;
  pctPoligono: number;
}

/** Convierte un item de la API al formato mapeado para la UI */
export function mapReporteManzanaPorEstado(item: ReporteManzanaPorEstadoItem): ManzanaReportePorEstadoMapeado {
  return {
    totalManzanas: item.totalManzanas,
    pendiente: item.estado01,
    levantamiento: item.estado02,
    edicion: item.estado03,
    calidad: item.estado04,
    terminada: item.estado05,
    poligono: item.estado06,
    pctPendiente: item.pct01,
    pctLevantamiento: item.pct02,
    pctEdicion: item.pct03,
    pctCalidad: item.pct04,
    pctTerminada: item.pct05,
    pctPoligono: item.pct06
  };
}
