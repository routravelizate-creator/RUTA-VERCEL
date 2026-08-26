/*
# Stripe payments, blog, and guide verification

## Resumen
1. Añade columnas para pagos reales de Stripe en `purchases` (stripe_session_id, stripe_payment_intent).
2. Actualiza el constraint de `payment_status` para incluir estados reales de Stripe.
3. Permite que routravelers aprobados inserten rutas (no solo admins).
4. Crea la tabla `blog_posts` para noticias/blog.
5. Crea la tabla `guide_verifications` para solicitudes de verificación de guias.
6. Añade columna `author_id` a routes si no existe (para que los routravelers sean autores).

## Tablas nuevas
- `blog_posts`: posts de blog/noticias (id, title, excerpt, content, image_url, is_published, created_at)
- `guide_verifications`: solicitudes de verificación de guias (id, user_id, full_name, email, doc_type, doc_url, status, created_at)

## Tablas modificadas
- `purchases`: añade stripe_session_id y stripe_payment_intent, actualiza payment_status CHECK
- `routes`: añade author_id si no existe

## Seguridad (RLS)
- `blog_posts`: lectura pública para posts publicados, escritura solo admin
- `guide_verifications`: lectura solo admin, inserción para usuarios autenticados
- `routes`: permite insertar a routravelers aprobados además de admins
*/

-- ===========================================
-- 1. PURCHASES: Stripe columns
-- ===========================================
DO $$ BEGIN
  ALTER TABLE purchases ADD COLUMN stripe_session_id text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE purchases ADD COLUMN stripe_payment_intent text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Actualizar constraint de payment_status
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_payment_status_check;
ALTER TABLE purchases ADD CONSTRAINT purchases_payment_status_check
  CHECK (payment_status IN ('simulado_pagado', 'simulado_fallido', 'pendiente', 'pagado', 'fallido'));

-- Permitir guest_email en purchases si no existe
DO $$ BEGIN
  ALTER TABLE purchases ADD COLUMN guest_email text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Hacer user_id nullable para compras de invitados
ALTER TABLE purchases ALTER COLUMN user_id DROP NOT NULL;

-- ===========================================
-- 2. ROUTES: author_id + routraveler insert policy
-- ===========================================
DO $$ BEGIN
  ALTER TABLE routes ADD COLUMN author_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Permitir que routravelers aprobados inserten rutas
DROP POLICY IF EXISTS "admin_insert_routes" ON routes;
CREATE POLICY "admin_insert_routes"
ON routes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.status = 'aprobado'
    AND profiles.role IN ('admin', 'routraveler')
  )
);

-- Permitir que routravelers actualicen sus propias rutas
DROP POLICY IF EXISTS "admin_update_routes" ON routes;
CREATE POLICY "admin_update_routes"
ON routes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.status = 'aprobado'
    AND profiles.role IN ('admin', 'routraveler')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.status = 'aprobado'
    AND profiles.role IN ('admin', 'routraveler')
  )
);

-- Permitir que routravelers eliminen sus propias rutas
DROP POLICY IF EXISTS "admin_delete_routes" ON routes;
CREATE POLICY "admin_delete_routes"
ON routes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.status = 'aprobado'
    AND profiles.role IN ('admin', 'routraveler')
  )
);

-- ===========================================
-- 3. BLOG POSTS
-- ===========================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_published_blog" ON blog_posts;
CREATE POLICY "read_published_blog"
ON blog_posts FOR SELECT
TO anon, authenticated
USING (is_published = true);

DROP POLICY IF EXISTS "admin_insert_blog" ON blog_posts;
CREATE POLICY "admin_insert_blog"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'aprobado'
  )
);

DROP POLICY IF EXISTS "admin_update_blog" ON blog_posts;
CREATE POLICY "admin_update_blog"
ON blog_posts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'aprobado'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'aprobado'
  )
);

DROP POLICY IF EXISTS "admin_delete_blog" ON blog_posts;
CREATE POLICY "admin_delete_blog"
ON blog_posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'aprobado'
  )
);

-- ===========================================
-- 4. GUIDE VERIFICATIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS guide_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  doc_type text NOT NULL,
  doc_description text NOT NULL DEFAULT '',
  doc_url text NOT NULL,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guide_verifications ENABLE ROW LEVEL SECURITY;

-- Un usuario puede ver sus propias solicitudes
DROP POLICY IF EXISTS "select_own_verifications" ON guide_verifications;
CREATE POLICY "select_own_verifications"
ON guide_verifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Un usuario autenticado puede crear solicitudes
DROP POLICY IF EXISTS "insert_own_verifications" ON guide_verifications;
CREATE POLICY "insert_own_verifications"
ON guide_verifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin puede ver todas las solicitudes
DROP POLICY IF EXISTS "admin_read_verifications" ON guide_verifications;
CREATE POLICY "admin_read_verifications"
ON guide_verifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'aprobado'
  )
);

-- Admin puede actualizar el estado
DROP POLICY IF EXISTS "admin_update_verifications" ON guide_verifications;
CREATE POLICY "admin_update_verifications"
ON guide_verifications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'aprobado'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'aprobado'
  )
);

-- ===========================================
-- 5. PROFILES: role constraint update
-- ===========================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('viajero', 'admin', 'routraveler'));

-- Permitir que el admin cambie el rol (necesario para promover a routraveler)
-- La funcion admin_set_user_status ya existe, creamos una para rol
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id uuid,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'aprobado'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('viajero', 'admin', 'routraveler') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE public.profiles
  SET role = p_role
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;

-- ===========================================
-- 6. PURCHASES: allow guest purchases (no user_id required)
-- ===========================================
DROP POLICY IF EXISTS "insert_own_purchases" ON purchases;
CREATE POLICY "insert_own_purchases"
ON purchases FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR (user_id IS NULL AND guest_email IS NOT NULL)
);

-- Admin puede ver todas las compras (ya existe pero re-creamos por si acaso)
DROP POLICY IF EXISTS "admin_read_all_purchases" ON purchases;
CREATE POLICY "admin_read_all_purchases"
ON purchases FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'aprobado'
  )
);
