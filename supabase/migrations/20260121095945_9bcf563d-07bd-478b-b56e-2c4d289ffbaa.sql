-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  section TEXT NOT NULL,
  element_id UUID,
  element_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - only authenticated users can view logs
CREATE POLICY "Authenticated users can view activity_logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (true);

-- Only system can insert logs (via service role or triggers)
CREATE POLICY "Authenticated users can create activity_logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_section ON public.activity_logs(section);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_element_id ON public.activity_logs(element_id);