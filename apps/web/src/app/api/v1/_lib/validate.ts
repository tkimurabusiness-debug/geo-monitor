import { Errors } from "./errors";

/** Parse JSON body with error handling */
export async function parseBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw Errors.badRequest("リクエストボディが不正です");
  }
}

/** Parse URL search params with defaults */
export function parseQuery(request: Request) {
  const url = new URL(request.url);
  return {
    get: (key: string) => url.searchParams.get(key),
    getInt: (key: string, defaultVal: number) => {
      const v = url.searchParams.get(key);
      return v ? parseInt(v, 10) : defaultVal;
    },
    getPage: () => ({
      page: Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10)),
      perPage: Math.min(
        100,
        Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10)),
      ),
    }),
  };
}

/** Require fields in body */
export function requireFields<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[],
): void {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      throw Errors.validation(`${String(field)} は必須です`);
    }
  }
}
