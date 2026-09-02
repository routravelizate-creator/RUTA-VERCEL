import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
};

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  const parts = signatureHeader.split(",");
  let timestamp = "";
  let v1Signature = "";

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1") v1Signature = value;
  }

  if (!timestamp || !v1Signature) return false;

  // Reject signatures older than 5 minutes to prevent replay attacks
  const ageSeconds = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (ageSeconds > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );
  const expectedSignature = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSignature === v1Signature;
}

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
    const signature = req.headers.get("Stripe-Signature") || "";

    // Verify the webhook signature properly
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsedEvent = JSON.parse(body);

    if (parsedEvent.type === "checkout.session.completed") {
      const session = parsedEvent.data.object;
      const routeId = session.metadata?.route_id;
      const userId = session.metadata?.user_id || null;
      const guestEmail = session.metadata?.guest_email || null;
      const stripeSessionId = session.id;
      const paymentIntent = session.payment_intent;
      const amountTotal = session.amount_total || 0;

      if (routeId) {
        // Fetch the route to get author and price for commission calculation
        const { data: route } = await supabase
          .from("routes")
          .select("id, title, price, author_id")
          .eq("id", routeId)
          .maybeSingle();

        // Calculate commission: 20% platform, 80% author
        const totalCents = amountTotal;
        const platformCents = Math.round(totalCents * 0.20);
        const authorCents = totalCents - platformCents;

        // Update the purchase record with payment confirmation and commission split
        await supabase
          .from("purchases")
          .update({
            payment_status: "pagado",
            stripe_payment_intent: paymentIntent,
            platform_commission: platformCents / 100,
            author_earnings: authorCents / 100,
          })
          .eq("stripe_session_id", stripeSessionId);

        // Send notification to the route author if they have an account
        if (route?.author_id) {
          await supabase.from("notifications").insert({
            user_id: route.author_id,
            type: "sale",
            title: "Nueva venta de tu ruta",
            message: `Tu ruta "${route.title}" ha sido comprada. Ganancia: ${(authorCents / 100).toFixed(2)}€`,
          });
        }

        // Send notification to the buyer if they have an account
        if (userId) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "purchase",
            title: "Compra completada",
            message: `Tu compra de "${route?.title || "la ruta"}" se ha completado. Ya puedes descargar los archivos.`,
          });
        }

        // --- Email notifications ---
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Email the buyer (registered user or guest)
        const buyerEmail: string | null = guestEmail || null;
        let buyerEmailFinal = buyerEmail;
        if (!buyerEmailFinal && userId) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .maybeSingle();
          if (userProfile?.email) buyerEmailFinal = userProfile.email;
        }

        if (buyerEmailFinal) {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              to: buyerEmailFinal,
              subject: `Tu ruta "${route?.title || ""}" - Confirmacion de compra`,
              html: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; border-bottom: 3px solid #3d6b4f; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #2c2520;">Routravel</h1>
                  </div>
                  <h2 style="color: #3d6b4f;">Compra completada</h2>
                  <p style="color: #2c2520; font-size: 16px; line-height: 1.6;">
                    Tu compra de la ruta <strong>"${route?.title || ""}"</strong> se ha completado correctamente.
                    Ya puedes descargar los archivos (GPX, PDF) y abrir el mapa desde la pagina de la ruta.
                  </p>
                  <p style="color: #6b6258; font-size: 14px; margin-top: 30px;">
                    Gracias por confiar en Routravel.
                  </p>
                </div>
              `,
            }),
          });
        }

        // Email the route author
        if (route?.author_id) {
          const { data: authorProfile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", route.author_id)
            .maybeSingle();

          if (authorProfile?.email) {
            await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({
                to: authorProfile.email,
                subject: `Nueva venta: "${route.title}"`,
                html: `
                  <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; border-bottom: 3px solid #3d6b4f; padding-bottom: 20px; margin-bottom: 30px;">
                      <h1 style="color: #2c2520;">Routravel</h1>
                    </div>
                    <h2 style="color: #3d6b4f;">Tienes una nueva venta</h2>
                    <p style="color: #2c2520; font-size: 16px; line-height: 1.6;">
                      Tu ruta <strong>"${route.title}"</strong> ha sido comprada.
                    </p>
                    <p style="color: #2c2520; font-size: 16px; line-height: 1.6;">
                      Tu ganancia (80%): <strong>${(authorCents / 100).toFixed(2)}€</strong><br>
                      Comision de la plataforma (20%): ${(platformCents / 100).toFixed(2)}€
                    </p>
                    <p style="color: #6b6258; font-size: 14px; margin-top: 30px;">
                      Puedes ver el detalle de tus ganancias en tu panel de creador.
                    </p>
                  </div>
                `,
              }),
            });
          }
        }
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
