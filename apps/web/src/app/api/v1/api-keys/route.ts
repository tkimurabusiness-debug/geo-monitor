import { authenticate, getOrgSupabase } from "../_lib/auth";
import { success, error, withErrorHandling } from "../_lib/response";
import { parseBody, requireFields } from "../_lib/validate";

/** GET /api/v1/api-keys — List API keys for current org */
export const GET = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const supabase = await getOrgSupabase();

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, expires_at, created_at")
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false });

  return success(keys ?? []);
});

/** POST /api/v1/api-keys — Create a new API key */
export const POST = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const body = await parseBody<{ name: string; scopes?: string[] }>(req);
  requireFields(body, ["name"]);

  // Generate random key: gm_live_ + 40 hex chars
  const randomBytes = crypto.getRandomValues(new Uint8Array(20));
  const keyRaw =
    "gm_live_" +
    Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  // Hash for storage
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(keyRaw),
  );
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const keyPrefix = keyRaw.slice(0, 16) + "...";

  const supabase = await getOrgSupabase();
  const { data: created, error: dbError } = await supabase
    .from("api_keys")
    .insert({
      organization_id: auth.orgId,
      name: body.name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes: body.scopes ?? ["read", "write"],
    })
    .select("id, name, key_prefix, scopes, created_at")
    .single();

  if (dbError) throw dbError;

  // Return the full key ONCE — it's never shown again
  return success(
    {
      ...created,
      key: keyRaw, // Only returned on creation
    },
    201,
  );
});
