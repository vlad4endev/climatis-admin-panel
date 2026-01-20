-- Удаляем существующий внешний ключ на profiles
ALTER TABLE public.estimates DROP CONSTRAINT IF EXISTS estimates_created_by_id_fkey;

-- Добавляем новый внешний ключ на employees
ALTER TABLE public.estimates 
ADD CONSTRAINT estimates_created_by_id_fkey 
FOREIGN KEY (created_by_id) REFERENCES public.employees(id) ON DELETE SET NULL;