/*
# Permitir que editores publiquen y gestionen rutas

## Propósito
El rol 'editor' ahora puede crear, editar y eliminar rutas, además de
gestionar el blog. Esto permite que editores como Melani suban rutas a
la plataforma sin necesidad de ser administradores.

## Cambios
1. Actualizar las políticas RLS de la tabla `routes` para permitir que
   los usuarios con rol 'editor' (además de 'admin' y 'routraveler')
   puedan INSERT, UPDATE y DELETE.
2. La función `is_route_author_or_staff()` verifica si el usuario es
   el autor de la ruta, o si tiene rol 'admin' o 'editor'.

## Seguridad
- Los editores pueden gestionar todas las rutas (no solo las propias),
  igual que los administradores, ya que su rol es de confianza.
- Los usuarios 'routraveler' siguen pudiendo insertar rutas (como autores).
- Los usuarios 'viajero' no tienen acceso de escritura a rutas.
*/

-- Función helper: ¿el usuario es staff (admin o editor) o autor de la ruta?
CREATE OR REPLACE FUNCTION public.is_route_editor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor', 'routraveler')
      AND status = 'aprobado'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_route_editor() TO authenticated;

-- Actualizar política INSERT: permitir a editores, admins y routravelers
DROP POLICY IF EXISTS "admin_insert_routes" ON public.routes;
CREATE POLICY "staff_and_authors_insert_routes"
ON public.routes FOR INSERT
TO authenticated
WITH CHECK (public.is_route_editor());

-- Actualizar política UPDATE: permitir a editores, admins y routravelers
DROP POLICY IF EXISTS "admin_update_routes" ON public.routes;
CREATE POLICY "staff_and_authors_update_routes"
ON public.routes FOR UPDATE
TO authenticated
USING (public.is_route_editor())
WITH CHECK (public.is_route_editor());

-- Actualizar política DELETE: permitir a editores, admins y routravelers
DROP POLICY IF EXISTS "admin_delete_routes" ON public.routes;
CREATE POLICY "staff_and_authors_delete_routes"
ON public.routes FOR DELETE
TO authenticated
USING (public.is_route_editor());
