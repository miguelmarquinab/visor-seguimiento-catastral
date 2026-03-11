/**
 * Contrato del endpoint "Lista etapas por polígono".
 * GET poligono/listaretapas?ubigeos=000000,000000
 */

export interface PoligonoListaEtapasItem {
  total: number;
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  lote: string;
  poligono: string;
  resultadoPoligono?: string | null;
  uucc: number;
  qa1: boolean;
  qa2: boolean;
  cic: boolean;
  qa3: boolean;
  qa4: boolean;
  mun: boolean;
  conformidad: string | null;
}

export interface PoligonoListaEtapasResponse {
  success: boolean;
  message?: string | null;
  total?: number;
  validations?: unknown;
  data: PoligonoListaEtapasItem[];
  type?: unknown;
}
