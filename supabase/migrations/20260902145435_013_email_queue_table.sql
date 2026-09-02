/*
# Email queue table for notifications

## Purpose
Stores outgoing email notifications. The send-email edge function uses this
table as a fallback queue when no external email provider (e.g. Resend) is
configured. The admin can later process the queue or configure RESEND_API_KEY
to send emails directly.
*/

CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  html_body text,
  text_body text,
  status text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Only admin can read the email queue
CREATE POLICY "admin_read_email_queue" ON public.email_queue
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Only the service role (edge functions) can insert
-- No INSERT policy for authenticated/anon — service role bypasses RLS

-- Only admin can update/delete
CREATE POLICY "admin_update_email_queue" ON public.email_queue
  FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_delete_email_queue" ON public.email_queue
  FOR DELETE TO authenticated
  USING (public.is_admin());
