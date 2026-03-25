/** Generic API response wrapper */
export interface ApiResponse<T> {
  data: T;
  error: string | null;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}
