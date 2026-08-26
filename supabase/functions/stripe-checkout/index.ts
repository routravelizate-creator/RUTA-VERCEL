import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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
    const { route_id, user_id, guest_email, origin } = await req.json();

    if (!route_id) {
      return new Response(JSON.stringify({ error: "route_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the route to get the price
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, title, price")
      .eq("id", route_id)
      .maybeSingle();

    if (routeError || !route) {
      return new Response(JSON.stringify({ error: "Route not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Stripe Checkout Session with dynamic pricing
    const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][unit_amount]": String(Math.round(Number(route.price) * 100)),
        "line_items[0][price_data][product_data][name]": route.title,
        "success_url": `${origin}/ruta/${route_id}?payment=success`,
        "cancel_url": `${origin}/ruta/${route_id}?payment=cancelled`,
        "metadata[route_id]": route_id,
        "metadata[user_id]": user_id || "",
        "metadata[guest_email]": guest_email || "",
      }),
    });

    const session = await sessionResponse.json();

    if (!sessionResponse.ok) {
      return new Response(JSON.stringify({ error: session.error?.message || "Stripe error" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a pending purchase record
    await supabase.from("purchases").insert({
      user_id: user_id || null,
      guest_email: guest_email || null,
      route_id: route_id,
      payment_status: "pendiente",
      stripe_session_id: session.id,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
