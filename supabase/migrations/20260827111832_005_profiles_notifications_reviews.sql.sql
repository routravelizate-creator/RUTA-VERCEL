/*
# Perfiles completos, notificaciones, reseñas y corrección de visibilidad

## Resumen
1. Añade campos al perfil: apellidos, fecha de nacimiento, foto de perfil, biografía, valoración media.
2. Crea tabla `notifications` para notificaciones de usuario.
3. Crea tabla `reviews` para reseñas reales entre usuarios.
4. Cambia el trigger para que los usuarios nuevos se creen como 'aprobado' por defecto (no 'pendiente') para que puedan usar la web inmediatamente.
5. Actualiza el perfil del trigger para incluir los nuevos campos.

## Tablas nuevas
- `notifications`: notificaciones de usuario (id, user_id, type, title, message, is_read, created_at)
- `reviews`: reseñas reales (id, reviewer_id, route_id, rating, comment, created_at)

## Tablas modificadas
- `profiles`: añade last_name, birth_date, avatar_url, bio, rating_avg, rating_count

## Seguridad
- `notifications`: lectura/escritura solo del propio usuario
- `reviews`: lectura pública, escritura solo para usuarios autenticados que hayan comprado la ruta
*/

-- ===========================================
-- 1. PROFILES: nuevos campos
-- ===========================================
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN last_name text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN birth_date date;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN avatar_url text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN bio text NOT NULL DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN rating_avg numeric(3,2) NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN rating_count integer NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ===========================================
-- 2. NOTIFICATIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications"
ON notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===========================================
-- 3. REVIEWS
-- ===========================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(reviewer_id, route_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Lectura pública de reseñas
DROP POLICY IF EXISTS "read_all_reviews" ON reviews;
CREATE POLICY "read_all_reviews"
ON reviews FOR SELECT
TO anon, authenticated
USING (true);

-- Solo usuarios autenticados pueden crear reseñas
DROP POLICY IF EXISTS "insert_own_review" ON reviews;
CREATE POLICY "insert_own_review"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

-- Actualizar propia reseña
DROP POLICY IF EXISTS "update_own_review" ON reviews;
CREATE POLICY "update_own_review"
ON reviews FOR UPDATE
TO authenticated
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- Eliminar propia reseña
DROP POLICY IF EXISTS "delete_own_review" ON reviews;
CREATE POLICY "delete_own_review"
ON reviews FOR DELETE
TO authenticated
USING (auth.uid() = reviewer_id);

-- ===========================================
-- 4. TRIGGER: usuarios nuevos aprobados por defecto
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, last_name, birth_date, avatar_url, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'last_name',
    NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date,
    NEW.raw_user_meta_data->>'avatar_url',
    'aprobado'
  );

  -- Crear notificación de bienvenida
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    NEW.id,
    'bienvenida',
    '¡Bienvenido a Routravel!',
    'Tu cuenta está lista. Ya puedes explorar y comprar rutas creadas por otros viajeros.'
  );

  RETURN NEW;
END;
$$;

-- ===========================================
-- 5. Función para actualizar rating del perfil
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_profile_rating(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating numeric;
  total_count integer;
BEGIN
  -- El rating del perfil se basa en las reseñas de sus rutas
  SELECT COALESCE(AVG(r.rating), 0), COUNT(*)
  INTO avg_rating, total_count
  FROM reviews r
  JOIN routes rt ON rt.id = r.route_id
  WHERE rt.author_id = p_user_id;

  UPDATE profiles
  SET rating_avg = ROUND(avg_rating, 2),
      rating_count = total_count
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_profile_rating(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_profile_rating(uuid) TO authenticated;

-- Trigger para actualizar rating cuando se inserta una reseña
CREATE OR REPLACE FUNCTION public.on_review_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  route_author uuid;
BEGIN
  SELECT author_id INTO route_author FROM routes WHERE id = NEW.route_id;
  IF route_author IS NOT NULL THEN
    PERFORM public.update_profile_rating(route_author);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_inserted ON reviews;
CREATE TRIGGER on_review_inserted
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION public.on_review_inserted();

DROP TRIGGER IF EXISTS on_review_deleted ON reviews;
CREATE TRIGGER on_review_deleted
AFTER DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION public.on_review_inserted();

-- ===========================================
-- 6. Actualizar perfiles existentes a aprobado
-- ===========================================
UPDATE profiles SET status = 'aprobado' WHERE status = 'pendiente' AND role = 'viajero';
