/*
# Admin access controls for Routravel

## Resumen
Corrige el acceso del panel de administración sin exponer ni permitir modificar privilegios desde el navegador.

## Cambios
1. `profiles`
   - Los administradores aprobados pueden consultar todos los perfiles para gestionar solicitudes.
   - Los usuarios normales solo pueden consultar su propio perfil.
   - Los usuarios normales solo pueden modificar su nombre; no pueden modificar su rol ni su estado.
2. Nueva función `admin_set_user_status`
   - Permite a un administrador aprobado aprobar o rechazar una cuenta.
   - Comprueba el permiso del administrador dentro de la base de datos.
   - No puede ser ejecutada por visitantes no autenticados.

## Seguridad
- Se revocan las modificaciones generales del perfil para usuarios autenticados.
- El cambio de estado se realiza únicamente mediante una función protegida y no desde una actualización directa del navegador.
*/

DROP POLICY IF EXISTS "select_admin_profiles" ON profiles;
CREATE POLICY "select_admin_profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
      AND admin_profile.status = 'aprobado'
  )
  OR auth.uid() = id
);

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name) ON profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_status(
  p_user_id uuid,
  p_status text
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

  IF p_status NOT IN ('aprobado', 'rechazado', 'pendiente') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.profiles
  SET status = p_status
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text) TO authenticated;
