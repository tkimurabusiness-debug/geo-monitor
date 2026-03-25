/**
 * Proxy helper: Next.js API Route → FastAPI internal service.
 *
 * Usage:
 *   const result = await proxyToFastAPI("/internal/diagnosis/run", { site_id, url });
 */

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";
const INTERNAL_KEY = process.env.INTERNAL_API_KEY ?? "dev-internal-key";

export async function proxyToFastAPI<T = unknown>(
  path: string,
  body: unknown,
  method: "POST" | "GET" = "POST",
): Promise<T> {
  const url = `${FASTAPI_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": INTERNAL_KEY,
    },
    body: method !== "GET" ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FastAPI error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}
