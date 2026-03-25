"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Data fetching hook with mock/real toggle.
 *
 * Usage:
 *   const { data, loading } = useFetch<Site[]>('/sites', mockSites);
 */
export function useFetch<T>(
  path: string,
  mockData: T,
  params?: Record<string, string>,
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(USE_MOCK ? mockData : null);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (USE_MOCK) {
      setData(mockData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(path, params);
      setData(result);
    } catch (e: any) {
      console.error(`[useFetch] ${path}:`, e);
      setError(e.message ?? "データの取得に失敗しました");
      // Fall back to mock data on error
      setData(mockData);
    } finally {
      setLoading(false);
    }
  }, [path, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Mutation hook for POST/PATCH/DELETE with mock fallback.
 */
export function useMutation<TReq, TRes = unknown>(
  method: "post" | "patch" | "delete",
  path: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (body?: TReq): Promise<TRes | null> => {
      if (USE_MOCK) {
        // Simulate delay in mock mode
        await new Promise((r) => setTimeout(r, 500));
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await api[method]<TRes>(path, body);
        return result;
      } catch (e: any) {
        setError(e.message ?? "操作に失敗しました");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [method, path],
  );

  return { mutate, loading, error };
}
