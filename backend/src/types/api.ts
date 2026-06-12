export interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data, timestamp: new Date().toISOString() };
}

export function fail(error: string): ApiError {
  return { success: false, error, timestamp: new Date().toISOString() };
}
