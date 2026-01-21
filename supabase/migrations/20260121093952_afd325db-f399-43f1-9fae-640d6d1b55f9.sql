-- Add file_path column to documents table
ALTER TABLE public.documents ADD COLUMN file_path TEXT;

-- Create storage bucket for document files
INSERT INTO storage.buckets (id, name, public) VALUES ('document-files', 'document-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for document files
CREATE POLICY "Authenticated users can view document files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'document-files');

CREATE POLICY "Authenticated users can upload document files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'document-files');

CREATE POLICY "Authenticated users can delete document files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'document-files');