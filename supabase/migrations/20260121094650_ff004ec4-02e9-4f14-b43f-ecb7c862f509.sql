-- Create document_attachments table (same structure as estimate_attachments)
CREATE TABLE public.document_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view document_attachments"
ON public.document_attachments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create document_attachments"
ON public.document_attachments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete document_attachments"
ON public.document_attachments FOR DELETE
TO authenticated
USING (true);