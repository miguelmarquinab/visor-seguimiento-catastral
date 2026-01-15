export interface Organizacion {
  idOrganizacion: number;
  nombreOrganizacion: string;
  codigoUbigeo: string;   // ojo: en tu JSON es string
  departamento: string;
  provincia: string;
  distrito: string;
  logo: string | null;
}
