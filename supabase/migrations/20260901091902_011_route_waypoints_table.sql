/*
# Add route_waypoints table

## Purpose
Store individual points of interest for each route. These are used by:
- The interactive map editor (mejora #4)
- The auto-generated PDF (mejora #2)
- The auto-generated GPX file (mejora #3)
*/

CREATE TABLE IF NOT EXISTS public.route_waypoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  lat double precision,
  lng double precision,
  ord integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_route_waypoints_route_id ON public.route_waypoints(route_id);
CREATE INDEX IF NOT EXISTS idx_route_waypoints_ord ON public.route_waypoints(route_id, ord);

ALTER TABLE public.route_waypoints ENABLE ROW LEVEL SECURITY;

-- Public can read waypoints for published routes
CREATE POLICY "read_published_waypoints" ON public.route_waypoints
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_waypoints.route_id
      AND routes.is_published = true
    )
  );

-- Authenticated users can read waypoints for their own routes (even unpublished)
CREATE POLICY "read_own_waypoints" ON public.route_waypoints
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_waypoints.route_id
      AND routes.author_id = auth.uid()
    )
  );

-- Authors can insert waypoints for their own routes
CREATE POLICY "insert_own_waypoints" ON public.route_waypoints
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_waypoints.route_id
      AND routes.author_id = auth.uid()
    )
  );

-- Authors can update waypoints for their own routes
CREATE POLICY "update_own_waypoints" ON public.route_waypoints
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_waypoints.route_id
      AND routes.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_waypoints.route_id
      AND routes.author_id = auth.uid()
    )
  );

-- Authors can delete waypoints for their own routes
CREATE POLICY "delete_own_waypoints" ON public.route_waypoints
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_waypoints.route_id
      AND routes.author_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "admin_all_waypoints" ON public.route_waypoints
  FOR ALL TO authenticated
  USING (public.is_admin());
