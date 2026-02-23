export interface ConteoEstadoItem {
  estado: string;
  nroManzanas: number;
  nombreEstado: string;
}

export interface ConteoEstadosResponse {
  success: boolean;
  message: string;
  total: number;
  data: ConteoEstadoItem[];
}