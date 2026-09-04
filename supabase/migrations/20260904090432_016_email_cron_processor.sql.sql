/*
# Instalar pg_net y pg_cron para procesar cola de emails

## Propósito
Instalar las extensiones pg_net y pg_cron para poder enviar emails
almacenados en la cola (email_queue) de forma automática.

## Cambios
1. Instalar pg_net (permite hacer peticiones HTTP desde Postgres)
2. Instalar pg_cron (permite ejecutar tareas programadas)
3. Crear función process_email_queue() que recorre los emails pendientes
   y hace una petición HTTP al edge function send-email para cada uno
4. Programar un cron job que ejecute la función cada minuto

## Seguridad
- La función usa la service role key de Supabase Vault
- Solo procesa emails con estado 'pendiente'
- Marca los emails como 'enviado' o 'error' según el resultado
*/

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- Función para procesar la cola de emails
CREATE OR REPLACE FUNCTION public.process_email_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  email_record RECORD;
  request_id bigint;
  response_status int;
  response_body text;
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- Obtener las credenciales de Supabase Vault
  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  v_supabase_url := current_setting('app.supabase_url', true);

  IF v_service_key IS NULL OR v_supabase_url IS NULL THEN
    RETURN;
  END IF;

  FOR email_record IN
    SELECT * FROM public.email_queue
    WHERE status = 'pendiente'
    ORDER BY created_at ASC
    LIMIT 10
  LOOP
    BEGIN
      -- Hacer petición HTTP al edge function send-email
      SELECT id INTO request_id FROM net.http_post(
        url := v_supabase_url || '/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key,
          'apikey', v_service_key
        ),
        body := jsonb_build_object(
          'to', email_record.to_email,
          'subject', email_record.subject,
          'html', email_record.html_body,
          'text', email_record.text_body
        )
      );

      -- Esperar a que termine la petición (máximo 25 segundos)
      SELECT status_code, content INTO response_status, response_body
      FROM net.http_collect_response(request_id, timeout_millis := 25000);

      IF response_status >= 200 AND response_status < 300 THEN
        UPDATE public.email_queue
        SET status = 'enviado', sent_at = now()
        WHERE id = email_record.id;
      ELSE
        UPDATE public.email_queue
        SET status = 'error', error_message = LEFT(COALESCE(response_body, ''), 500)
        WHERE id = email_record.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.email_queue
      SET status = 'error', error_message = LEFT(SQLERRM, 500)
      WHERE id = email_record.id;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_email_queue() TO authenticated;

-- Programar el cron job cada minuto
SELECT cron.schedule(
  'process-email-queue',
  '* * * * *',
  $$SELECT public.process_email_queue();$$
);
