import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAIL = "abecasismelani@gmail.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id, full_name, email, doc_type, doc_description, doc_url } = await req.json();

    if (!user_id || !full_name || !email || !doc_type || !doc_url) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save the verification request to the database
    const { data, error } = await supabase
      .from("guide_verifications")
      .insert({
        user_id,
        full_name,
        email,
        doc_type,
        doc_description,
        doc_url,
        status: "pendiente",
      })
      .select()
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build notification email
    const emailHtml = `
      <h2>Nueva solicitud de verificación de guía</h2>
      <p><strong>Nombre:</strong> ${full_name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Tipo de documentación:</strong> ${doc_type}</p>
      <p><strong>Descripción:</strong> ${doc_description || "Sin descripción"}</p>
      <p><strong>Documento:</strong> <a href="${doc_url}">Ver documento</a></p>
      <p>Revisa esta solicitud desde el panel de administración de Routravel.</p>
    `;

    const emailSubject = `Nueva solicitud de verificación: ${full_name}`;

    // Try to send via Resend if API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (resendApiKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Routravel <noreply@routravel.com>",
          to: [ADMIN_EMAIL],
          subject: emailSubject,
          html: emailHtml,
        }),
      });
    } else {
      // No Resend key: queue the email so it can be sent later
      await supabase.from("email_queue").insert({
        to_email: ADMIN_EMAIL,
        subject: emailSubject,
        html_body: emailHtml,
        status: "pendiente",
      });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
