-- Add deleted_at column to all relevant tables for soft delete functionality

-- Requests
ALTER TABLE public.requests ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
CREATE INDEX idx_requests_deleted_at ON public.requests(deleted_at);

-- Documents
ALTER TABLE public.documents ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
CREATE INDEX idx_documents_deleted_at ON public.documents(deleted_at);

-- Estimates
ALTER TABLE public.estimates ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
CREATE INDEX idx_estimates_deleted_at ON public.estimates(deleted_at);

-- Assignments
ALTER TABLE public.assignments ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
CREATE INDEX idx_assignments_deleted_at ON public.assignments(deleted_at);

-- Clients
ALTER TABLE public.clients ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
CREATE INDEX idx_clients_deleted_at ON public.clients(deleted_at);

-- Service Objects
ALTER TABLE public.service_objects ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
CREATE INDEX idx_service_objects_deleted_at ON public.service_objects(deleted_at);

-- Contacts
ALTER TABLE public.contacts ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
CREATE INDEX idx_contacts_deleted_at ON public.contacts(deleted_at);

-- Tasks
ALTER TABLE public.tasks ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
CREATE INDEX idx_tasks_deleted_at ON public.tasks(deleted_at);