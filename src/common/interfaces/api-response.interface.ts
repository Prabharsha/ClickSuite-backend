export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
}

/**
 * Marker shape returned by services that paginate. ResponseInterceptor
 * unwraps it into the top-level `data` + `pagination` fields.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export function isPaginatedResult<T>(
  value: unknown,
): value is PaginatedResult<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    "pagination" in value &&
    Array.isArray((value as PaginatedResult<T>).data)
  );
}
