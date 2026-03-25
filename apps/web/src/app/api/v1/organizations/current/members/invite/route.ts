import { authenticate } from "../../../../_lib/auth";
import { success, withErrorHandling } from "../../../../_lib/response";
import { parseBody, requireFields } from "../../../../_lib/validate";

/** POST /api/v1/organizations/current/members/invite */
export const POST = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const body = await parseBody<{ email: string; role?: string }>(req);
  requireFields(body, ["email"]);

  // TODO: D2.2 follow-up — Send invitation email, create pending invite record
  return success({
    status: "invited",
    email: body.email,
    role: body.role ?? "member",
  }, 201);
});
