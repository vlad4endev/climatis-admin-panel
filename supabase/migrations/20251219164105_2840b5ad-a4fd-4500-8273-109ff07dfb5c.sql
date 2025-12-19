
-- Создание ENUM типов
CREATE TYPE public.client_type AS ENUM ('legal_entity', 'individual_entrepreneur');
CREATE TYPE public.request_status AS ENUM ('new', 'needs_calculation', 'awaiting_materials', 'in_progress', 'partially_completed', 'completed', 'closed');
CREATE TYPE public.request_type AS ENUM ('repair', 'maintenance', 'installation');
CREATE TYPE public.request_priority AS ENUM ('urgent', 'normal');
CREATE TYPE public.task_status AS ENUM ('новая', 'в работе', 'частично выполнена', 'выполнена');
CREATE TYPE public.estimate_status AS ENUM ('черновик', 'готов', 'согласован');
CREATE TYPE public.estimate_type AS ENUM ('простой ремонт', 'сложный ремонт', 'по договору ТО');
CREATE TYPE public.assignment_status AS ENUM ('new', 'assigned', 'completed');
CREATE TYPE public.invoice_status AS ENUM ('подготовлен', 'выставлен', 'оплачен', 'отменён');
CREATE TYPE public.contract_type AS ENUM ('maintenance', 'general', 'one-time');
CREATE TYPE public.unit_type AS ENUM ('шт', 'м', 'кг', 'л', 'м²', 'м³', 'пара', 'к-т', 'мп', 'баллон', 'уп', 'кор');
CREATE TYPE public.operation_type AS ENUM ('приход', 'расход', 'возврат');
CREATE TYPE public.worker_category AS ENUM ('Инженер', 'Мастер', 'Монтажник 6 разр.', 'Монтажник 5 разр.');

-- Таблица профилей пользователей
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица клиентов
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    type client_type NOT NULL DEFAULT 'legal_entity',
    division TEXT DEFAULT '',
    main_contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    additional_contacts JSONB DEFAULT '[]'::jsonb,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица сотрудников
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    position TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица бригад
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    leader_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    competencies TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица связи бригад и участников
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(team_id, employee_id)
);

-- Таблица объектов обслуживания
CREATE TABLE public.service_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    object_name TEXT NOT NULL,
    address TEXT DEFAULT '',
    access_description TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица договоров/документов
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    contract_type contract_type NOT NULL DEFAULT 'general',
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    object_id UUID REFERENCES public.service_objects(id) ON DELETE SET NULL,
    response_conditions TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    file_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица заявок
CREATE TABLE public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL UNIQUE,
    status request_status NOT NULL DEFAULT 'new',
    type request_type NOT NULL DEFAULT 'repair',
    priority request_priority NOT NULL DEFAULT 'normal',
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    object_id UUID NOT NULL REFERENCES public.service_objects(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    contract_conditions TEXT,
    problem_description TEXT DEFAULT '',
    comments TEXT DEFAULT '',
    desired_date DATE,
    responsible_manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    assigned_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    assigned_engineer_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    planned_visit_date DATE,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    hours_spent NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица задач
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    assignee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
    proposed_deadline DATE,
    agreed_deadline DATE,
    status task_status NOT NULL DEFAULT 'новая',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица чеклистов задач
CREATE TABLE public.task_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица комментариев к задачам
CREATE TABLE public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица расчётов (смет)
CREATE TABLE public.estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
    estimate_number TEXT NOT NULL,
    estimate_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status estimate_status NOT NULL DEFAULT 'черновик',
    type estimate_type NOT NULL DEFAULT 'простой ремонт',
    created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    engineer_comment TEXT,
    customer_calculation JSONB DEFAULT '{"overheadPercent": 95, "estimatedProfitPercent": 58, "transportPercent": 6, "warehousePercent": 3}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица блоков работ
CREATE TABLE public.work_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица строк работ
CREATE TABLE public.work_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_block_id UUID NOT NULL REFERENCES public.work_blocks(id) ON DELETE CASCADE,
    category worker_category NOT NULL,
    plan_hours NUMERIC(10,2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    rate NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица материалов расчёта
CREATE TABLE public.estimate_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
    spare_part_id UUID,
    material_name TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 0,
    price_per_unit NUMERIC(10,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица нарядов
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_number TEXT NOT NULL UNIQUE,
    status assignment_status NOT NULL DEFAULT 'new',
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    comments TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица счетов
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
    estimate_id UUID REFERENCES public.estimates(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status invoice_status NOT NULL DEFAULT 'подготовлен',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица категорий склада
CREATE TABLE public.warehouse_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица запчастей/материалов
CREATE TABLE public.spare_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    internal_article TEXT DEFAULT '',
    category_id UUID REFERENCES public.warehouse_categories(id) ON DELETE SET NULL,
    unit unit_type NOT NULL DEFAULT 'шт',
    current_stock NUMERIC(10,2) DEFAULT 0,
    min_stock NUMERIC(10,2) DEFAULT 0,
    purchase_price NUMERIC(10,2) DEFAULT 0,
    retail_price NUMERIC(10,2) DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Связь материалов с категорией
ALTER TABLE public.estimate_materials 
ADD CONSTRAINT fk_estimate_materials_spare_part 
FOREIGN KEY (spare_part_id) REFERENCES public.spare_parts(id) ON DELETE SET NULL;

-- Таблица движения склада
CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    operation_type operation_type NOT NULL,
    related_request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Таблица материалов в движении
CREATE TABLE public.stock_movement_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_movement_id UUID NOT NULL REFERENCES public.stock_movements(id) ON DELETE CASCADE,
    spare_part_id UUID NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Триггеры для updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_objects_updated_at BEFORE UPDATE ON public.service_objects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouse_categories_updated_at BEFORE UPDATE ON public.warehouse_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_spare_parts_updated_at BEFORE UPDATE ON public.spare_parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_movements_updated_at BEFORE UPDATE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Функция для создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
    RETURN NEW;
END;
$$;

-- Триггер создания профиля
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Функция генерации номера заявки
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_num INTEGER;
BEGIN
    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 6) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.requests
    WHERE request_number LIKE year_prefix || '-%';
    NEW.request_number := year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_request_number_trigger
    BEFORE INSERT ON public.requests
    FOR EACH ROW
    WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
    EXECUTE FUNCTION public.generate_request_number();

-- Функция генерации номера наряда
CREATE OR REPLACE FUNCTION public.generate_assignment_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_num INTEGER;
BEGIN
    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(assignment_number FROM 8) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.assignments
    WHERE assignment_number LIKE 'Н-' || year_prefix || '-%';
    NEW.assignment_number := 'Н-' || year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_assignment_number_trigger
    BEFORE INSERT ON public.assignments
    FOR EACH ROW
    WHEN (NEW.assignment_number IS NULL OR NEW.assignment_number = '')
    EXECUTE FUNCTION public.generate_assignment_number();

-- Функция генерации номера счёта
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_num INTEGER;
BEGIN
    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.invoices
    WHERE invoice_number LIKE 'С-' || year_prefix || '-%';
    NEW.invoice_number := 'С-' || year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
    EXECUTE FUNCTION public.generate_invoice_number();

-- Функция генерации номера сметы
CREATE OR REPLACE FUNCTION public.generate_estimate_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_num INTEGER;
BEGIN
    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(estimate_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.estimates
    WHERE estimate_number LIKE 'Р-' || year_prefix || '-%';
    NEW.estimate_number := 'Р-' || year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_estimate_number_trigger
    BEFORE INSERT ON public.estimates
    FOR EACH ROW
    WHEN (NEW.estimate_number IS NULL OR NEW.estimate_number = '')
    EXECUTE FUNCTION public.generate_estimate_number();

-- Включаем RLS для всех таблиц
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movement_materials ENABLE ROW LEVEL SECURITY;

-- RLS политики - доступ для авторизованных пользователей
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update employees" ON public.employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete employees" ON public.employees FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update teams" ON public.teams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete teams" ON public.teams FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view team_members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create team_members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete team_members" ON public.team_members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view service_objects" ON public.service_objects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create service_objects" ON public.service_objects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update service_objects" ON public.service_objects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete service_objects" ON public.service_objects FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update documents" ON public.documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete documents" ON public.documents FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view requests" ON public.requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create requests" ON public.requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update requests" ON public.requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete requests" ON public.requests FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view task_checklist_items" ON public.task_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create task_checklist_items" ON public.task_checklist_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update task_checklist_items" ON public.task_checklist_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete task_checklist_items" ON public.task_checklist_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view task_comments" ON public.task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create task_comments" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete task_comments" ON public.task_comments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view estimates" ON public.estimates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create estimates" ON public.estimates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update estimates" ON public.estimates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete estimates" ON public.estimates FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view work_blocks" ON public.work_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create work_blocks" ON public.work_blocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update work_blocks" ON public.work_blocks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete work_blocks" ON public.work_blocks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view work_rows" ON public.work_rows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create work_rows" ON public.work_rows FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update work_rows" ON public.work_rows FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete work_rows" ON public.work_rows FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view estimate_materials" ON public.estimate_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create estimate_materials" ON public.estimate_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update estimate_materials" ON public.estimate_materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete estimate_materials" ON public.estimate_materials FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view assignments" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update assignments" ON public.assignments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete assignments" ON public.assignments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view warehouse_categories" ON public.warehouse_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create warehouse_categories" ON public.warehouse_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update warehouse_categories" ON public.warehouse_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete warehouse_categories" ON public.warehouse_categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view spare_parts" ON public.spare_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create spare_parts" ON public.spare_parts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update spare_parts" ON public.spare_parts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete spare_parts" ON public.spare_parts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view stock_movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create stock_movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stock_movements" ON public.stock_movements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stock_movements" ON public.stock_movements FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view stock_movement_materials" ON public.stock_movement_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create stock_movement_materials" ON public.stock_movement_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete stock_movement_materials" ON public.stock_movement_materials FOR DELETE TO authenticated USING (true);

-- Создаём индексы для производительности
CREATE INDEX idx_service_objects_client_id ON public.service_objects(client_id);
CREATE INDEX idx_documents_client_id ON public.documents(client_id);
CREATE INDEX idx_requests_client_id ON public.requests(client_id);
CREATE INDEX idx_requests_object_id ON public.requests(object_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_tasks_request_id ON public.tasks(request_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_estimates_request_id ON public.estimates(request_id);
CREATE INDEX idx_assignments_request_id ON public.assignments(request_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_spare_parts_category_id ON public.spare_parts(category_id);
CREATE INDEX idx_stock_movements_request_id ON public.stock_movements(related_request_id);
