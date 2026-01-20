-- Add requisites field to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS requisites TEXT;