-- Create storage bucket for estimate attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('estimate-attachments', 'estimate-attachments', true);

-- Storage policies for estimate attachments
CREATE POLICY "Authenticated users can view estimate attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'estimate-attachments');

CREATE POLICY "Authenticated users can upload estimate attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'estimate-attachments');

CREATE POLICY "Authenticated users can delete estimate attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'estimate-attachments');

-- Create table for tracking estimate attachments
CREATE TABLE public.estimate_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.estimate_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for estimate_attachments
CREATE POLICY "Authenticated users can view estimate_attachments"
ON public.estimate_attachments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create estimate_attachments"
ON public.estimate_attachments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete estimate_attachments"
ON public.estimate_attachments FOR DELETE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_estimate_attachments_estimate_id ON public.estimate_attachments(estimate_id);