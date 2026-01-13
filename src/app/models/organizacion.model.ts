export interface Organizacion {
  idOrganizacion: number;
  nombreOrganizacion: string;
  codigoUbigeo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  logo?: string | null;
}
