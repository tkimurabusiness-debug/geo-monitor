"use client";

import { api, GeoMonitorAPI } from "@/lib/api-client";

/**
 * Hook to get the API client.
 * In mock mode, returns the same client (which hits /api/v1/ routes
 * that can return mock data if Supabase is not configured).
 */
export function useAPI(): GeoMonitorAPI {
  return api;
}
