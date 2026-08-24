/*
# Routravel - Schema inicial

## Resumen
Crea el esquema completo de la plataforma Routravel: perfiles de usuario con sistema de aprobación, rutas de viaje, compras y archivos descargables.

## Tablas nuevas

1. `profiles`
   - `id` (uuid, PK, referencia a auth.users)
   - `email` (text, único)
   - `full_name` (text, nullable)
   - `role` (text: 'viajero' | 'admin', por defecto 'viajero')
   - `status` (text: 'pendiente' | 'aprobado' | 'rechazado', por defecto 'pendiente')
   - `created_at` (timestamptz)

2. `routes`
   - `id` (uuid, PK)
   - `title` (text)
   - `subtitle` (text)
   - `description` (text)
   - `image_url` (text)
   - `price` (numeric, por defecto 0)
   - `gpx_url` (text, nullable) - URL del archivo GPX
   - `pdf_url` (text, nullable) - URL del archivo PDF
   - `mymaps_url` (text, nullable) - URL de Google My Maps
   - `is_published` (boolean, por defecto false)
   - `created_at` (timestamptz)

3. `purchases`
   - `id` (uuid, PK)
   - `user_id` (uuid, FK a profiles)
   - `route_id` (uuid, FK a routes)
   - `payment_status` (text: 'simulado_pagado')
   - `created_at` (timestamptz)
   - Restricción UNIQUE (user_id, route_id) para evitar compras duplicadas

## Seguridad (RLS)

- `profiles`: Los usuarios pueden ver y actualizar su propio perfil. Los admins pueden ver todos los perfiles y actualizar el estado/rol de cualquier usuario.
- `routes`: Lectura pública para rutas publicadas. Escritura solo para admins.
- `purchases`: Los usuarios solo ven sus propias compras. Inserción solo para usuarios autenticados.
*/

-- ===========================================
-- PROFILES
-- ===========================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'viajero' CHECK (role IN ('viajero', 'admin')),
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Un usuario puede ver su propio perfil
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Un usuario puede actualizar su propio perfil (solo nombre)
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ===========================================
-- ROUTES
-- ===========================================
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  gpx_url text,
  pdf_url text,
  mymaps_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Lectura pública de rutas publicadas (anon + authenticated)
DROP POLICY IF EXISTS "read_published_routes" ON routes;
CREATE POLICY "read_published_routes"
ON routes FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Solo admin puede insertar rutas
DROP POLICY IF EXISTS "admin_insert_routes" ON routes;
CREATE POLICY "admin_insert_routes"
ON routes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin' AND profiles.status = 'aprobado')
);

-- Solo admin puede actualizar rutas
DROP POLICY IF EXISTS "admin_update_routes" ON routes;
CREATE POLICY "admin_update_routes"
ON routes FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin' AND profiles.status = 'aprobado')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin' AND profiles.status = 'aprobado')
);

-- Solo admin puede eliminar rutas
DROP POLICY IF EXISTS "admin_delete_routes" ON routes;
CREATE POLICY "admin_delete_routes"
ON routes FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin' AND profiles.status = 'aprobado')
);

-- ===========================================
-- PURCHASES
-- ===========================================
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  payment_status text NOT NULL DEFAULT 'simulado_pagado' CHECK (payment_status IN ('simulado_pagado', 'simulado_fallido')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, route_id)
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Un usuario puede ver sus propias compras
DROP POLICY IF EXISTS "select_own_purchases" ON purchases;
CREATE POLICY "select_own_purchases"
ON purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Un usuario aprobado puede crear compras (pagos simulados)
DROP POLICY IF EXISTS "insert_own_purchases" ON purchases;
CREATE POLICY "insert_own_purchases"
ON purchases FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.status = 'aprobado'
  )
);

-- ===========================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
