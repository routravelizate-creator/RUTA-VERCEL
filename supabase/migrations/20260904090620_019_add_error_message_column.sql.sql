/*
# Añadir columna error_message a email_queue

## Propósito
La función process_email_queue() actualiza el campo error_message cuando
un email falla, pero esa columna no existe en la tabla.
*/

ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS error_message text;
