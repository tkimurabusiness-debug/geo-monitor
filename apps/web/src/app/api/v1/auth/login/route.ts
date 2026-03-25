import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { success, error, withErrorHandling } from "../../_lib/response";
import { parseBody, requireFields } from "../../_lib/validate";
import { Errors } from "../../_lib/errors";

/** POST /api/v1/auth/login */
export const POST = withErrorHandling(async (req) => {
  const body = await parseBody<{ email: string; password: string }>(req);
  requireFields(body, ["email", "password"]);

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (authError || !data.user) {
    throw Errors.unauthorized("メールアドレスまたはパスワードが正しくありません");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, organization_id, role")
    .eq("id", data.user.id)
    .single();

  return success({
    user: profile,
    session: {
      access_token: data.session?.access_token,
      expires_at: data.session?.expires_at,
    },
  });
});
