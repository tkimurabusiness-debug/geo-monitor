const BASE_URL = "/api/v1";

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: { code: string; message: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; per_page: number };
  error: null;
}

type Result<T> = ApiResponse<T> | ApiError;

/**
 * API client for GEO Monitor REST API.
 * All UI data fetching goes through this client.
 */
export class GeoMonitorAPI {
  private baseUrl: string;

  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl + path, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    return this.request<T>(url.toString(), { method: "GET" });
  }

  async getPaginated<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<PaginatedResponse<T>> {
    const url = new URL(this.baseUrl + path, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      method: "GET",
      credentials: "include",
    });
    return res.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(this.baseUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(this.baseUrl + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(this.baseUrl + path, { method: "DELETE" });
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      credentials: "include",
    });

    const json: Result<T> = await res.json();

    if (json.error) {
      throw new ApiClientError(json.error.code, json.error.message, res.status);
    }

    return json.data;
  }
}

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Singleton instance */
export const api = new GeoMonitorAPI();
