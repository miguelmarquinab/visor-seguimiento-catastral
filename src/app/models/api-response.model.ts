export interface ApiResponse<T> {
  success: boolean;
  message: string;
  total: number;
  validations: any;
  data: T;
}
