import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

/** POST /api/v1/billing/webhook — Stripe webhook handler */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        const plan = session.metadata?.plan;
        const subscriptionId = session.subscription as string;

        if (orgId && plan) {
          // Update org plan
          await supabase
            .from("organizations")
            .update({ plan })
            .eq("id", orgId);

          // Upsert subscription
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
          await supabase.from("subscriptions").upsert({
            organization_id: orgId,
            stripe_subscription_id: subscriptionId,
            plan,
            status: "active",
            current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          }, { onConflict: "organization_id" });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subUpdated = event.data.object as any;
        const orgResp = await supabase
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", subUpdated.customer as string)
          .single();

        if (orgResp.data) {
          const status = subUpdated.status === "active" ? "active"
            : subUpdated.status === "past_due" ? "past_due"
            : subUpdated.status === "trialing" ? "trialing"
            : "canceled";

          await supabase.from("subscriptions").upsert({
            organization_id: orgResp.data.id,
            stripe_subscription_id: subUpdated.id,
            status,
            current_period_start: subUpdated.current_period_start ? new Date(subUpdated.current_period_start * 1000).toISOString() : null,
            current_period_end: subUpdated.current_period_end ? new Date(subUpdated.current_period_end * 1000).toISOString() : null,
          }, { onConflict: "organization_id" });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const orgResp = await supabase
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", subscription.customer as string)
          .single();

        if (orgResp.data) {
          await supabase
            .from("organizations")
            .update({ plan: "basic" })
            .eq("id", orgResp.data.id);

          await supabase
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("organization_id", orgResp.data.id);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[Stripe Webhook] Processing error:", err);
  }

  return NextResponse.json({ received: true });
}
