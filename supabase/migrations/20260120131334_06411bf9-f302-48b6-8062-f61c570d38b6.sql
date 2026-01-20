-- Junction table for linking contacts to service objects (many-to-many)
CREATE TABLE public.service_object_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_object_id UUID NOT NULL REFERENCES public.service_objects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_object_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.service_object_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view service_object_contacts"
ON public.service_object_contacts
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create service_object_contacts"
ON public.service_object_contacts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service_object_contacts"
ON public.service_object_contacts
FOR DELETE
USING (true);