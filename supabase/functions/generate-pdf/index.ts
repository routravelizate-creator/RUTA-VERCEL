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

    const { route_id } = await req.json();

    if (!route_id) {
      return new Response(
        JSON.stringify({ error: "route_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the route with all details
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, title, subtitle, description, image_url, price, gpx_url, mymaps_url, author_id")
      .eq("id", route_id)
      .maybeSingle();

    if (routeError || !route) {
      return new Response(
        JSON.stringify({ error: "Route not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch author profile if available
    let authorName = "Routravel";
    if (route.author_id) {
      const { data: author } = await supabase
        .from("profiles")
        .select("full_name, last_name")
        .eq("id", route.author_id)
        .maybeSingle();
      if (author) {
        authorName = [author.full_name, author.last_name].filter(Boolean).join(" ") || "Routravel";
      }
    }

    // Fetch waypoints if they exist
    const { data: waypoints } = await supabase
      .from("route_waypoints")
      .select("name, description, lat, lng, ord")
      .eq("route_id", route_id)
      .order("ord", { ascending: true });

    // Build HTML for the PDF
    const waypointsHtml = waypoints && waypoints.length > 0
      ? `
        <div class="waypoints">
          <h2>Puntos de interes</h2>
          ${waypoints.map((wp: any, i: number) => `
            <div class="waypoint">
              <div class="wp-number">${i + 1}</div>
              <div class="wp-content">
                <h3>${escapeHtml(wp.name)}</h3>
                ${wp.description ? `<p>${escapeHtml(wp.description)}</p>` : ""}
                ${wp.lat && wp.lng ? `<p class="coords">GPS: ${wp.lat.toFixed(6)}, ${wp.lng.toFixed(6)}</p>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      `
      : "";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 2cm; }
  body { font-family: Georgia, serif; color: #2c2520; line-height: 1.6; }
  .header { text-align: center; border-bottom: 3px solid #3d6b4f; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 28px; margin: 0 0 8px; color: #2c2520; }
  .header .subtitle { font-size: 16px; color: #6b6258; }
  .header .meta { font-size: 12px; color: #9b9388; margin-top: 10px; }
  .cover-image { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin: 20px 0; }
  .description { font-size: 14px; margin-bottom: 30px; }
  .waypoints { margin-top: 30px; }
  .waypoints h2 { font-size: 20px; color: #3d6b4f; border-bottom: 1px solid #e0d8cc; padding-bottom: 8px; }
  .waypoint { display: flex; gap: 15px; margin: 20px 0; page-break-inside: avoid; }
  .wp-number { width: 36px; height: 36px; border-radius: 50%; background: #3d6b4f; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; flex-shrink: 0; }
  .wp-content h3 { margin: 0 0 5px; font-size: 16px; }
  .wp-content p { margin: 3px 0; font-size: 13px; color: #6b6258; }
  .coords { font-family: monospace; font-size: 12px; color: #3d6b4f; }
  .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e0d8cc; text-align: center; font-size: 11px; color: #9b9388; }
</style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(route.title)}</h1>
    <div class="subtitle">${escapeHtml(route.subtitle)}</div>
    <div class="meta">Itinerario creado por ${escapeHtml(authorName)} · Routravel</div>
  </div>
  ${route.image_url ? `<img class="cover-image" src="${escapeHtml(route.image_url)}" alt="" />` : ""}
  <div class="description">${escapeHtml(route.description).replace(/\n/g, '<br>')}</div>
  ${waypointsHtml}
  ${route.mymaps_url ? `<p style="margin-top:30px;font-size:13px;color:#3d6b4f;">Mapa interactivo: ${escapeHtml(route.mymaps_url)}</p>` : ""}
  <div class="footer">
    Documento generado automaticamente por Routravel · ${new Date().toLocaleDateString('es-ES')}
  </div>
</body>
</html>`;

    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
