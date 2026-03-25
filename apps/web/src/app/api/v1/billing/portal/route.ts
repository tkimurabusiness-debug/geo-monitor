import Stripe from "stripe";
import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { Errors } from "../../_lib/errors";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
}

/** POST /api/v1/billing/portal — Create Stripe Customer Portal session */
export const POST = withErrorHandling(async (req) => {
  if (!process.env.STRIPE_SECRET_KEY) throw Errors.badRequest("Stripe未設定");
  const stripe = getStripe();
  const auth = await authenticate(req);
  const supabase = await getOrgSupabase();

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", auth.orgId)
    .single();

  if (!org?.stripe_customer_id) {
    throw Errors.badRequest("課金情報が設定されていません。まずプランを選択してください。");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${baseUrl}/settings`,
  });

  return success({ portal_url: session.url });
});
