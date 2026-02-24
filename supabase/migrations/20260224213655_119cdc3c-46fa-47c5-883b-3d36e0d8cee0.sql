
-- Индексы на deleted_at для быстрой фильтрации мягко удалённых записей
CREATE INDEX IF NOT EXISTS idx_requests_deleted_at ON public.requests (deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON public.documents (deleted_at);
CREATE INDEX IF NOT EXISTS idx_estimates_deleted_at ON public.estimates (deleted_at);
CREATE INDEX IF NOT EXISTS idx_assignments_deleted_at ON public.assignments (deleted_at);
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON public.clients (deleted_at);
CREATE INDEX IF NOT EXISTS idx_service_objects_deleted_at ON public.service_objects (deleted_at);
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON public.contacts (deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks (deleted_at);

-- Индексы на created_at для сортировки списков
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON public.estimates (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at DESC);

-- Индексы на внешние ключи для JOIN-запросов
CREATE INDEX IF NOT EXISTS idx_requests_client_id ON public.requests (client_id);
CREATE INDEX IF NOT EXISTS idx_requests_object_id ON public.requests (object_id);
CREATE INDEX IF NOT EXISTS idx_requests_contract_id ON public.requests (contract_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents (client_id);
CREATE INDEX IF NOT EXISTS idx_documents_object_id ON public.documents (object_id);
CREATE INDEX IF NOT EXISTS idx_service_objects_client_id ON public.service_objects (client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON public.contacts (client_id);
CREATE INDEX IF NOT EXISTS idx_estimates_request_id ON public.estimates (request_id);
CREATE INDEX IF NOT EXISTS idx_assignments_request_id ON public.assignments (request_id);
CREATE INDEX IF NOT EXISTS idx_assignments_estimate_id ON public.assignments (estimate_id);
CREATE INDEX IF NOT EXISTS idx_assignments_team_id ON public.assignments (team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_request_id ON public.tasks (request_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_request_id ON public.invoices (request_id);
CREATE INDEX IF NOT EXISTS idx_invoices_estimate_id ON public.invoices (estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_materials_estimate_id ON public.estimate_materials (estimate_id);
CREATE INDEX IF NOT EXISTS idx_work_blocks_estimate_id ON public.work_blocks (estimate_id);
CREATE INDEX IF NOT EXISTS idx_work_rows_work_block_id ON public.work_rows (work_block_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category_id ON public.spare_parts (category_id);
CREATE INDEX IF NOT EXISTS idx_stock_movement_materials_movement_id ON public.stock_movement_materials (stock_movement_id);
CREATE INDEX IF NOT EXISTS idx_stock_movement_materials_spare_part_id ON public.stock_movement_materials (spare_part_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_task_id ON public.task_checklist_items (task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments (task_id);
