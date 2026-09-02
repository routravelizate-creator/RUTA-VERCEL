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

    const { to, subject, html, text } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "to and subject are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Supabase's built-in email sending (no external service needed)
    // The admin can also configure a custom SMTP via Supabase Auth settings.
    // For now we use a simple approach: store the email in a queue table
    // and the admin can configure an external provider later.

    // Try to send via Resend if API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (resendApiKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Routravel <no-reply@routravel.com>",
          to: to,
          subject: subject,
          html: html || text || "",
        }),
      });

      if (!emailResponse.ok) {
        const errData = await emailResponse.json();
        return new Response(
          JSON.stringify({ error: errData.message || "Failed to send email" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ sent: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no Resend key, store in email_queue for manual processing
    await supabase.from("email_queue").insert({
      to_email: to,
      subject: subject,
      html_body: html || null,
      text_body: text || null,
      status: "pendiente",
    });

    return new Response(
      JSON.stringify({ queued: true, message: "Email queued. Configure RESEND_API_KEY to send directly." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
