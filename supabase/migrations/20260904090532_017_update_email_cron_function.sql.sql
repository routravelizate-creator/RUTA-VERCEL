/*
# Actualizar función process_email_queue para usar Vault secrets

## Propósito
La función process_email_queue necesita leer las credenciales de Vault
para poder hacer peticiones HTTP al edge function send-email.

## Cambios
1. Actualizar la función para leer SUPABASE_URL y SUPABASE_ANON_KEY de Vault
2. El edge function send-email tendrá verify_jwt = false para que el cron
   pueda llamarlo con la anon key
*/

DROP FUNCTION IF EXISTS public.process_email_queue();

CREATE OR REPLACE FUNCTION public.process_email_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  email_record RECORD;
  request_id bigint;
  response_status int;
  response_body text;
  v_supabase_url text;
  v_anon_key text;
BEGIN
  -- Obtener credenciales de Vault
  SELECT decrypted_secret INTO v_anon_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_ANON_KEY'
  LIMIT 1;

  SELECT decrypted_secret INTO v_supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_URL'
  LIMIT 1;

  IF v_anon_key IS NULL OR v_supabase_url IS NULL THEN
    RETURN;
  END IF;

  FOR email_record IN
    SELECT * FROM public.email_queue
    WHERE status = 'pendiente'
    ORDER BY created_at ASC
    LIMIT 10
  LOOP
    BEGIN
      SELECT id INTO request_id FROM net.http_post(
        url := v_supabase_url || '/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key,
          'apikey', v_anon_key
        ),
        body := jsonb_build_object(
          'to', email_record.to_email,
          'subject', email_record.subject,
          'html', email_record.html_body,
          'text', email_record.text_body
        )
      );

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
