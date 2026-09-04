/*
# Corregir el trigger del email de bienvenida

## Propósito
El trigger anterior usaba current_setting('app_url', true) que no existe.
Esta versión usa una URL hardcodeada y el formato correcto.
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

  INSERT INTO public.profiles (id, email, full_name, last_name, birth_date, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'birth_date',
    NEW.raw_user_meta_data->>'avatar_url'
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
      <p style="color: #5a4a3a; font-size: 16px; line-height: 1.6;">¡Gracias por unirte a Routravel! Tu cuenta ha sido creada correctamente.</p>
      <p style="color: #5a4a3a; font-size: 16px; line-height: 1.6;">Tu cuenta está pendiente de aprobación por nuestro equipo. Una vez aprobada, podrás explorar y comprar rutas creadas por viajeros como tú.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://ddinygjnjvhluphupltg.supabase.co" style="background-color: #2d4a3e; color: white; padding: 12px 32px; border-radius: 50px; text-decoration: none; font-size: 16px; display: inline-block;">Visitar Routravel</a>
      </div>
      <p style="color: #8a7a6a; font-size: 14px; line-height: 1.6; margin-top: 30px;">Si no creaste esta cuenta, puedes ignorar este email.</p>
      <hr style="border: none; border-top: 1px solid #e0d8d0; margin: 30px 0;">
      <p style="color: #aaa; font-size: 12px; text-align: center;">Routravel — Mapas reales, hechos por gente que viaja.</p>
    </div>',
    'pendiente'
  );

  RETURN NEW;
END;
$$;
