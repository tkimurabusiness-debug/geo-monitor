import Stripe from "stripe";
import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { parseBody, requireFields } from "../../_lib/validate";
import { Errors } from "../../_lib/errors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
});

/** Price IDs per plan — set in Stripe Dashboard */
const PLAN_PRICES: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
};

/** POST /api/v1/billing/checkout — Create Stripe Checkout session */
export const POST = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const body = await parseBody<{ plan: string }>(req);
  requireFields(body, ["plan"]);

  const priceId = PLAN_PRICES[body.plan];
  if (!priceId) throw Errors.badRequest("無効なプランです");

  const supabase = await getOrgSupabase();

  // Get or create Stripe customer
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, stripe_customer_id")
    .eq("id", auth.orgId)
    .single();

  if (!org) throw Errors.notFound("組織");

  let customerId = org.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { org_id: org.id },
    });
    customerId = customer.id;

    await supabase
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id);
  }

  // Create checkout session
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/settings?checkout=success`,
    cancel_url: `${baseUrl}/settings?checkout=cancel`,
    metadata: { org_id: auth.orgId, plan: body.plan },
  });

  return success({ checkout_url: session.url });
});
