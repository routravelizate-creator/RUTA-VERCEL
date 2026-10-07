/*
# Auto-aprobar usuarios registrados

## Propósito
Los nuevos usuarios que se registran quedaban en estado 'pendiente' y no podían
usar la plataforma hasta que un admin los aprobara manualmente. Esto frenaba
el registro y la compra de rutas.

## Cambios
1. El trigger handle_new_user() ahora crea perfiles con status='aprobado'
   en lugar de 'pendiente'
2. Los usuarios pueden iniciar sesión y comprar rutas inmediatamente
3. Solo quienes quieran publicar rutas (ser routraveler) necesitan verificación
4. Actualiza los perfiles existentes en estado 'pendiente' a 'aprobado'
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name text;
BEGIN
  v_user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  INSERT INTO public.profiles (id, email, full_name, last_name, birth_date, avatar_url, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'birth_date',
    NEW.raw_user_meta_data->>'avatar_url',
    'viajero',
    'aprobado'
  );

  INSERT INTO public.email_queue (to_email, subject, html_body, status)
  VALUES (
    NEW.email,
    '¡Bienvenido a Routravel!',
    '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #faf8f5;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2d4a3e; font-size: 28px; margin-bottom: 10px;">¡Bienvenido a Routravel!</h1>
      </div>
      <p style="color: #5a4a3a; font-size: 16px; line-height: 1.6;">Hola ' || v_user_name || ',</p>
      <p style="color: #5a4a3a; font-size: 16px; line-height: 1.6;">¡Gracias por unirte a Routravel! Tu cuenta ya está activa.</p>
      <p style="color: #5a4a3a; font-size: 16px; line-height: 1.6;">Ya puedes explorar y comprar rutas creadas por viajeros como tú. Cada ruta incluye un mapa descargable con puntos exactos, listo para abrir en Google Maps.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://ddinygjnjvhluphupltg.supabase.co" style="background-color: #2d4a3e; color: white; padding: 12px 32px; border-radius: 50px; text-decoration: none; font-size: 16px; display: inline-block;">Explorar rutas</a>
      </div>
      <p style="color: #5a4a3a; font-size: 16px; line-height: 1.6;">¿Conoces una ruta que merece estar aquí? Puedes solicitar ser Routraveler y publicar tus propios mapas.</p>
      <hr style="border: none; border-top: 1px solid #e0d8d0; margin: 30px 0;">
      <p style="color: #aaa; font-size: 12px; text-align: center;">Routravel — Mapas reales, hechos por gente que viaja.</p>
    </div>',
    'pendiente'
  );

  RETURN NEW;
END;
$$;

-- Aprobar todos los perfiles pendientes existentes
UPDATE public.profiles SET status = 'aprobado' WHERE status = 'pendiente';
