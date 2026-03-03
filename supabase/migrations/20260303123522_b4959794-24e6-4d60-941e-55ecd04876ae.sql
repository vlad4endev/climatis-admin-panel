
CREATE TABLE public.monitoring_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name text,
  event_type text NOT NULL,
  page text,
  element text,
  message text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.monitoring_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view monitoring_logs"
ON public.monitoring_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can insert monitoring_logs"
ON public.monitoring_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE INDEX idx_monitoring_logs_created_at ON public.monitoring_logs(created_at DESC);
CREATE INDEX idx_monitoring_logs_event_type ON public.monitoring_logs(event_type);
CREATE INDEX idx_monitoring_logs_user_id ON public.monitoring_logs(user_id);
