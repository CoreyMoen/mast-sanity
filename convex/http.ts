/**
 * http.ts — HTTP endpoints for external webhooks.
 *
 * Defines HTTP routes for:
 * - Stripe webhook events (subscription changes, payment events)
 * - Clerk webhook events (user created/updated/deleted, org changes)
 *
 * All webhook mutations are internal — only callable from these HTTP actions.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";
import { Webhook } from "svix";

const http = httpRouter();

// ─── Stripe Webhook ─────────────────────────────────────────────────────────
// Receives Stripe events for subscription lifecycle management.
// Endpoint: POST /stripe-webhook
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx: any, request: any) => {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    // Verify webhook signature
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecretKey || !webhookSecret) {
      console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET env var");
      return new Response("Server configuration error", { status: 500 });
    }

    let event: Stripe.Event;
    try {
      const stripeClient = new Stripe(stripeSecretKey);
      event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const clerkUserId = session.metadata?.clerkUserId;
          const stripeCustomerId = typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
          if (clerkUserId && stripeCustomerId) {
            await ctx.runMutation(internal.billing.linkStripeCustomer, {
              clerkUserId,
              stripeCustomerId,
            });
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
          await ctx.runMutation(internal.billing.handleSubscriptionUpdate, {
            stripeCustomerId: customerId,
            subscriptionTier: mapPriceToTier(subscription.items.data[0]?.price?.id),
            subscriptionStatus: mapStripeStatus(subscription.status),
          });
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
          await ctx.runMutation(internal.billing.handleSubscriptionUpdate, {
            stripeCustomerId: customerId,
            subscriptionTier: "free",
            subscriptionStatus: "canceled",
          });
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
          if (customerId) {
            await ctx.runMutation(internal.billing.handleSubscriptionUpdate, {
              stripeCustomerId: customerId,
              subscriptionTier: "free",
              subscriptionStatus: "past_due",
            });
          }
          break;
        }

        default:
          break;
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      return new Response("Webhook processing failed", { status: 500 });
    }
  }),
});

// ─── Clerk Webhook ──────────────────────────────────────────────────────────
// Receives Clerk events for user and organization sync.
// Endpoint: POST /clerk-webhook
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx: any, request: any) => {
    const body = await request.text();

    // Verify Clerk webhook signature using svix
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET env var");
      return new Response("Server configuration error", { status: 500 });
    }

    let event: any;
    try {
      const wh = new Webhook(webhookSecret);
      const headers = {
        "svix-id": request.headers.get("svix-id") ?? "",
        "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
        "svix-signature": request.headers.get("svix-signature") ?? "",
      };
      event = wh.verify(body, headers) as any;
    } catch (err) {
      console.error("Clerk webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    try {
      switch (event.type) {
        case "user.created": {
          const { id, email_addresses, first_name, last_name, image_url } = event.data;
          await ctx.runMutation(internal.users.createUser, {
            clerkId: id,
            email: email_addresses[0]?.email_address ?? "",
            name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || "User",
            imageUrl: image_url ?? "",
          });
          break;
        }

        case "user.updated": {
          const { id, email_addresses, first_name, last_name, image_url } = event.data;
          await ctx.runMutation(internal.users.updateUser, {
            clerkId: id,
            email: email_addresses[0]?.email_address ?? "",
            name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || "User",
            imageUrl: image_url ?? "",
          });
          break;
        }

        case "user.deleted": {
          const { id } = event.data;
          if (id) {
            await ctx.runMutation(internal.users.deleteUser, { clerkId: id });
          }
          break;
        }

        case "organization.created": {
          const { id, name, created_by } = event.data;
          await ctx.runMutation(internal.organizations.createFromWebhook, {
            clerkOrgId: id,
            name: name ?? "Untitled Organization",
            ownerId: created_by,
          });
          break;
        }

        case "organizationMembership.created": {
          const { organization, public_user_data, role } = event.data;
          await ctx.runMutation(internal.orgMembers.addMemberFromWebhook, {
            clerkOrgId: organization.id,
            clerkUserId: public_user_data.user_id,
            role: role ?? "org:member",
          });
          break;
        }

        default:
          break;
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Clerk webhook error:", error);
      return new Response("Webhook processing failed", { status: 500 });
    }
  }),
});

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Map a Stripe price ID to an application subscription tier.
 * Price IDs are read from environment variables so they can differ
 * between development and production Stripe accounts.
 */
function mapPriceToTier(priceId: string): "free" | "pro" | "business" {
  const priceToTier: Record<string, "pro" | "business"> = {};

  const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const proYearly = process.env.STRIPE_PRO_YEARLY_PRICE_ID;
  const bizMonthly = process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID;
  const bizYearly = process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID;

  if (proMonthly) priceToTier[proMonthly] = "pro";
  if (proYearly) priceToTier[proYearly] = "pro";
  if (bizMonthly) priceToTier[bizMonthly] = "business";
  if (bizYearly) priceToTier[bizYearly] = "business";

  return priceToTier[priceId] ?? "free";
}

/**
 * Map Stripe subscription status to our application status.
 */
function mapStripeStatus(
  stripeStatus: string,
): "active" | "past_due" | "canceled" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "active";
  }
}

export default http;
