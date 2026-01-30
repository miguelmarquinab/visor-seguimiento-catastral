export interface UbigeoItemDto {
  codigoUbigeo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string; // "150105"
}

// Lo que usará el UI
export interface Option {
  value: string;
  label: string;
}

export interface UbigeoResponse {
  success: boolean;
  message: string;
  total: number;
  data: UbigeoItemDto[]; // Aquí es donde vive tu array real
}
