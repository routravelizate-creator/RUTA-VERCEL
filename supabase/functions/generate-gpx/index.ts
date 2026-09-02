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

    const { data: route } = await supabase
      .from("routes")
      .select("id, title, subtitle")
      .eq("id", route_id)
      .maybeSingle();

    if (!route) {
      return new Response(
        JSON.stringify({ error: "Route not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: waypoints } = await supabase
      .from("route_waypoints")
      .select("name, description, lat, lng, ord")
      .eq("route_id", route_id)
      .order("ord", { ascending: true });

    if (!waypoints || waypoints.length === 0) {
      return new Response(
        JSON.stringify({ error: "No waypoints found for this route" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    gpx += `<gpx version="1.1" creator="Routravel" xmlns="http://www.topografix.com/GPX/1/1">\n`;
    gpx += `  <metadata>\n`;
    gpx += `    <name>${escapeXml(route.title)}</name>\n`;
    gpx += `    <desc>${escapeXml(route.subtitle)}</desc>\n`;
    gpx += `    <time>${now}</time>\n`;
    gpx += `  </metadata>\n`;

    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      if (wp.lat != null && wp.lng != null) {
        gpx += `  <wpt lat="${wp.lat}" lon="${wp.lng}">\n`;
        gpx += `    <name>${escapeXml(wp.name || `Punto ${i + 1}`)}</name>\n`;
        if (wp.description) {
          gpx += `    <desc>${escapeXml(wp.description)}</desc>\n`;
        }
        gpx += `    <sym>Flag, Blue</sym>\n`;
        gpx += `  </wpt>\n`;
      }
    }

    // Add a route (rte) element connecting all waypoints
    gpx += `  <rte>\n`;
    gpx += `    <name>${escapeXml(route.title)}</name>\n`;
    for (const wp of waypoints) {
      if (wp.lat != null && wp.lng != null) {
        gpx += `    <rtept lat="${wp.lat}" lon="${wp.lng}">\n`;
        gpx += `      <name>${escapeXml(wp.name || "")}</name>\n`;
        gpx += `    </rtept>\n`;
      }
    }
    gpx += `  </rte>\n`;
    gpx += `</gpx>`;

    return new Response(JSON.stringify({ gpx }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeXml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
