import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Errors } from "./errors";

export interface AuthContext {
  userId: string;
  orgId: string;
  role: string;
  authMethod: "session" | "api_key";
}

/**
 * Dual authentication: session (cookie) OR API key (Bearer token).
 * Both resolve to the same AuthContext with org_id.
 *
 * Usage in route handlers:
 *   const auth = await authenticate(request);
 */
export async function authenticate(request: Request): Promise<AuthContext> {
  // Check for API key first (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authenticateApiKey(authHeader.slice(7));
  }

  // Fall back to Supabase session (cookie-based)
  return authenticateSession();
}

/** Authenticate via Supabase session cookie */
async function authenticateSession(): Promise<AuthContext> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only in API routes
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw Errors.unauthorized();

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) throw Errors.unauthorized("ユーザープロフィールが見つかりません");

  return {
    userId: user.id,
    orgId: profile.organization_id,
    role: profile.role,
    authMethod: "session",
  };
}

/** Authenticate via API key (Bearer token) */
async function authenticateApiKey(token: string): Promise<AuthContext> {
  // Hash the token to look up in DB
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Service role to bypass RLS for key lookup
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("id, organization_id, scopes, expires_at")
    .eq("key_hash", keyHash)
    .single();

  if (!apiKey) throw Errors.unauthorized("無効なAPIキーです");

  // Check expiry
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    throw Errors.unauthorized("APIキーの有効期限が切れています");
  }

  // Update last_used_at (fire and forget)
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id)
    .then();

  return {
    userId: "", // API key doesn't have a specific user
    orgId: apiKey.organization_id,
    role: "api_key",
    authMethod: "api_key",
  };
}

/**
 * Create a Supabase client scoped to the authenticated org.
 * Uses service role key so RLS is bypassed — we enforce org_id in queries manually.
 */
export async function getOrgSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );
}
