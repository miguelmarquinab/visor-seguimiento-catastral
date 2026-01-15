import { Organizacion } from './organizacion.model';

export interface UsuarioOrganizacionesData {
  organizaciones: Organizacion[];
  registros: number; // ojo: tu API también manda esto
}
