export interface LoginResponse{
  access_token: string;
  tokenTye?: string;
  expiresIn: number;
  roles?: string[];
}
