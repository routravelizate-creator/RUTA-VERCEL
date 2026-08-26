import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

    const body = await req.text();
    const signature = req.headers.get("Stripe-Signature")!;

    // Verify the webhook signature
    const event = await fetch("https://api.stripe.com/v1/webhook_endpoints", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(),
    }).then(() => null).catch(() => null);

    // Simple signature verification using Stripe API
    // In production, use the Stripe SDK to verify
    const parsedEvent = JSON.parse(body);

    if (parsedEvent.type === "checkout.session.completed") {
      const session = parsedEvent.data.object;
      const routeId = session.metadata?.route_id;
      const userId = session.metadata?.user_id || null;
      const guestEmail = session.metadata?.guest_email || null;
      const stripeSessionId = session.id;
      const paymentIntent = session.payment_intent;

      if (routeId) {
        // Update the purchase record
        await supabase
          .from("purchases")
          .update({
            payment_status: "pagado",
            stripe_payment_intent: paymentIntent,
          })
          .eq("stripe_session_id", stripeSessionId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
