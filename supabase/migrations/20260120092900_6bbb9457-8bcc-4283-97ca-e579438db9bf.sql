-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  is_main BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view contacts"
ON public.contacts FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create contacts"
ON public.contacts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update contacts"
ON public.contacts FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete contacts"
ON public.contacts FOR DELETE
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing main contacts from clients to contacts table
INSERT INTO public.contacts (client_id, name, phone, email, is_main)
SELECT id, main_contact_name, phone, COALESCE(email, ''), true
FROM public.clients
WHERE main_contact_name IS NOT NULL AND main_contact_name != '';