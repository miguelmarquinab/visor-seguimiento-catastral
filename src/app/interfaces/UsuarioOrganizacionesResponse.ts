import {Organizacion} from './Organizacion';

export interface UsuarioOrganizacionesResponse {
  success: boolean;
  message: string;
  total: number;
  validations: any;
  data: {
    organizaciones: Organizacion[];
  };
}
