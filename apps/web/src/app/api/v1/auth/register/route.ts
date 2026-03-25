import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { success, withErrorHandling } from "../../_lib/response";
import { parseBody, requireFields } from "../../_lib/validate";
import { Errors } from "../../_lib/errors";

/** POST /api/v1/auth/register */
export const POST = withErrorHandling(async (req) => {
  const body = await parseBody<{
    email: string;
    password: string;
    company_name: string;
    plan?: string;
  }>(req);
  requireFields(body, ["email", "password", "company_name"]);

  if (body.password.length < 8) {
    throw Errors.validation("パスワードは8文字以上にしてください");
  }

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

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: { data: { full_name: body.company_name } },
  });

  if (authError || !authData.user) {
    throw Errors.badRequest(authError?.message ?? "登録に失敗しました");
  }

  // 2. Create organization
  const slug = body.company_name
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u9fff]/g, "-")
    .replace(/-+/g, "-");

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: body.company_name,
      slug,
      plan: body.plan ?? "basic",
    })
    .select()
    .single();

  if (orgError) throw Errors.internal("組織の作成に失敗しました");

  // 3. Create user profile
  await supabase.from("users").insert({
    id: authData.user.id,
    email: body.email,
    full_name: body.company_name,
    organization_id: org.id,
    role: "owner",
  });

  return success(
    {
      user: {
        id: authData.user.id,
        email: body.email,
        full_name: body.company_name,
        organization_id: org.id,
        role: "owner",
      },
      organization: org,
    },
    201,
  );
});
