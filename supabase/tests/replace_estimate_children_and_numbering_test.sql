-- =============================================================================
--  Проверка миграции 20260824120000: replace_estimate_children + нумерация
--
--  Запуск на пустой локальной базе (Supabase не нужен — проверяется только SQL):
--
--    createdb estimates_check
--    psql -d estimates_check -v ON_ERROR_STOP=1 -f supabase/tests/replace_estimate_children_and_numbering_test.sql
--    dropdb estimates_check
--
--  Файл сам создаёт минимальную копию схемы, применяет миграцию и проверяет
--  результат через ASSERT. Успех = четыре строки NOTICE «OK: ...» без ошибок.
-- =============================================================================

-- Минимальная копия реальной схемы для тех таблиц, которые затрагивает миграция
CREATE TYPE public.worker_category AS ENUM ('Инженер','Мастер','Монтажник 6 разр.','Монтажник 5 разр.');
CREATE TYPE public.estimate_status AS ENUM ('черновик','готов','согласован');
CREATE TYPE public.estimate_type AS ENUM ('простой ремонт','сложный ремонт','по договору ТО','изготовление (производство)');
CREATE TYPE public.invoice_status AS ENUM ('подготовлен','выставлен','оплачен','отменён');
CREATE TYPE public.assignment_status AS ENUM ('draft','new','assigned','completed');

CREATE TABLE public.estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  estimate_number TEXT NOT NULL,
  estimate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status estimate_status NOT NULL DEFAULT 'черновик',
  type estimate_type NOT NULL DEFAULT 'простой ремонт',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.work_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  mode text NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual','price'))
);
CREATE TABLE public.work_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_block_id UUID NOT NULL REFERENCES public.work_blocks(id) ON DELETE CASCADE,
  category worker_category NOT NULL,
  plan_hours NUMERIC(10,2) DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  rate NUMERIC(10,2) DEFAULT 0
);
CREATE TABLE public.estimate_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  spare_part_id UUID,
  material_name TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 0,
  price_per_unit NUMERIC(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);
CREATE TABLE public.work_price_list (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL);
CREATE TABLE public.estimate_price_works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  work_block_id uuid REFERENCES public.work_blocks(id) ON DELETE CASCADE,
  price_item_id uuid REFERENCES public.work_price_list(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'шт',
  quantity numeric NOT NULL DEFAULT 0,
  price_per_unit numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'подготовлен'
);
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_number TEXT NOT NULL UNIQUE,
  status assignment_status NOT NULL DEFAULT 'new'
);
DO $r$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
END $r$;

-- Триггеры ровно как в проде (включая дубли на estimates/invoices/assignments)

-- Применяем саму миграцию (путь относительно этого файла)
\ir ../migrations/20260824120000_9f2b4c1e-5d76-4a83-b0e2-71c3f8a95d64.sql
-- Количество блоков (пересоздаёт replace_estimate_children с полем quantity)
\ir ../migrations/20260928120000_dd087136-24b4-42d2-b3f9-bdd67ebd83a3.sql

\set ON_ERROR_STOP on
-- Триггеры как в прод-схеме, включая исторические дубли имён
CREATE TRIGGER set_estimate_number BEFORE INSERT ON estimates FOR EACH ROW
  WHEN (NEW.estimate_number IS NULL OR NEW.estimate_number = '') EXECUTE FUNCTION generate_estimate_number();
CREATE TRIGGER trg_estimates_number BEFORE INSERT ON estimates FOR EACH ROW
  WHEN (NEW.estimate_number IS NULL OR NEW.estimate_number = '') EXECUTE FUNCTION generate_estimate_number();
CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON invoices FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '') EXECUTE FUNCTION generate_invoice_number();
CREATE TRIGGER trg_invoices_number BEFORE INSERT ON invoices FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '') EXECUTE FUNCTION generate_invoice_number();
CREATE TRIGGER generate_assignment_number_trigger BEFORE INSERT ON assignments FOR EACH ROW
  WHEN (NEW.assignment_number IS NULL OR NEW.assignment_number = '') EXECUTE FUNCTION generate_assignment_number();
-- этот триггер в проде создан БЕЗ условия WHEN — проверяем, что функция всё равно идемпотентна
CREATE TRIGGER trg_assignments_number BEFORE INSERT ON assignments FOR EACH ROW
  EXECUTE FUNCTION generate_assignment_number();

DO $t$
DECLARE
  y text := to_char(CURRENT_DATE,'YYYY');
  n text;
BEGIN
  -- === Нумерация расчётов ===
  INSERT INTO estimates(name, estimate_number) VALUES ('a','') RETURNING estimate_number INTO n;
  ASSERT n = 'Р-'||y||'-0001', 'estimate #1: '||n;
  INSERT INTO estimates(name, estimate_number) VALUES ('b','') RETURNING estimate_number INTO n;
  ASSERT n = 'Р-'||y||'-0002', 'estimate #2: '||n;
  -- ручной номер сохраняется (два триггера не перезаписывают его)
  INSERT INTO estimates(name, estimate_number) VALUES ('c','Р-'||y||'-9999') RETURNING estimate_number INTO n;
  ASSERT n = 'Р-'||y||'-9999', 'manual estimate number: '||n;
  -- нечисловой суффикс не ломает следующую вставку
  INSERT INTO estimates(name, estimate_number) VALUES ('d','Р-'||y||'-ABC');
  INSERT INTO estimates(name, estimate_number) VALUES ('e','') RETURNING estimate_number INTO n;
  ASSERT n = 'Р-'||y||'-10000', 'estimate after manual 9999: '||n;

  -- === Нумерация счетов (раньше второй счёт в году падал на CAST) ===
  INSERT INTO invoices(invoice_number) VALUES ('') RETURNING invoice_number INTO n;
  ASSERT n = 'С-'||y||'-0001', 'invoice #1: '||n;
  INSERT INTO invoices(invoice_number) VALUES ('') RETURNING invoice_number INTO n;
  ASSERT n = 'С-'||y||'-0002', 'invoice #2: '||n;
  INSERT INTO invoices(invoice_number) VALUES ('') RETURNING invoice_number INTO n;
  ASSERT n = 'С-'||y||'-0003', 'invoice #3: '||n;

  -- === Нумерация заданий ===
  INSERT INTO assignments(assignment_number) VALUES ('') RETURNING assignment_number INTO n;
  ASSERT n = 'Н-'||y||'-0001', 'assignment #1: '||n;
  INSERT INTO assignments(assignment_number) VALUES ('') RETURNING assignment_number INTO n;
  ASSERT n = 'Н-'||y||'-0002', 'assignment #2: '||n;
  INSERT INTO assignments(assignment_number) VALUES ('Н-'||y||'-XYZ');
  INSERT INTO assignments(assignment_number) VALUES ('') RETURNING assignment_number INTO n;
  ASSERT n = 'Н-'||y||'-0003', 'assignment after non-numeric: '||n;

  RAISE NOTICE 'OK: генераторы номеров';
END $t$;

-- === UNIQUE индекс создан ===
DO $t$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='estimates_estimate_number_key'),
    'UNIQUE index on estimate_number not created';
  RAISE NOTICE 'OK: UNIQUE estimates.estimate_number';
END $t$;

-- === replace_estimate_children ===
DO $t$
DECLARE
  eid uuid;
  pid uuid;
  payload jsonb;
  blk_manual uuid;
  blk_price  uuid;
BEGIN
  INSERT INTO estimates(name, estimate_number) VALUES ('rpc','') RETURNING id INTO eid;
  INSERT INTO work_price_list(name) VALUES ('Монтаж') RETURNING id INTO pid;

  payload := jsonb_build_object(
    'work_blocks', jsonb_build_array(
      jsonb_build_object(
        'description','Блок 1','mode','manual','quantity',3,
        'rows', jsonb_build_array(
          jsonb_build_object('category','Инженер','plan_hours',1.5,'quantity',2,'rate',1000),
          jsonb_build_object('category','Мастер','plan_hours',0,'quantity',0,'rate',0)
        ),
        'price_works', '[]'::jsonb
      ),
      jsonb_build_object(
        'description','Блок 2','mode','price',
        'rows','[]'::jsonb,
        'price_works', jsonb_build_array(
          jsonb_build_object('price_item_id',pid,'name','Монтаж','unit','м','quantity',10,'price_per_unit',250),
          jsonb_build_object('price_item_id',NULL,'name','Пуско-наладка','unit','','quantity',1,'price_per_unit',5000)
        )
      )
    ),
    'materials', jsonb_build_array(
      jsonb_build_object('material_name','Труба','spare_part_id',NULL,'quantity',3.5,'price_per_unit',120),
      jsonb_build_object('material_name','Кран','spare_part_id',NULL,'quantity',1,'price_per_unit',900)
    ),
    'price_works', jsonb_build_array(
      jsonb_build_object('price_item_id',NULL,'name','Legacy работа','unit','шт','quantity',2,'price_per_unit',300)
    )
  );

  PERFORM replace_estimate_children(eid, payload);

  ASSERT (SELECT count(*) FROM work_blocks WHERE estimate_id=eid) = 2, 'work_blocks count';
  SELECT id INTO blk_manual FROM work_blocks WHERE estimate_id=eid AND sort_order=0;
  SELECT id INTO blk_price  FROM work_blocks WHERE estimate_id=eid AND sort_order=1;
  ASSERT (SELECT mode FROM work_blocks WHERE id=blk_manual)='manual', 'mode manual';
  ASSERT (SELECT mode FROM work_blocks WHERE id=blk_price)='price', 'mode price';
  ASSERT (SELECT description FROM work_blocks WHERE id=blk_price)='Блок 2', 'description';
  ASSERT (SELECT quantity FROM work_blocks WHERE id=blk_manual)=3, 'block quantity from payload';
  ASSERT (SELECT quantity FROM work_blocks WHERE id=blk_price)=1, 'block quantity default';

  ASSERT (SELECT count(*) FROM work_rows WHERE work_block_id=blk_manual)=2, 'work_rows count';
  ASSERT (SELECT plan_hours FROM work_rows WHERE work_block_id=blk_manual AND category='Инженер')=1.5, 'plan_hours';
  ASSERT (SELECT quantity   FROM work_rows WHERE work_block_id=blk_manual AND category='Инженер')=2,  'quantity int';

  ASSERT (SELECT count(*) FROM estimate_price_works WHERE work_block_id=blk_price)=2, 'block price_works count';
  ASSERT (SELECT unit FROM estimate_price_works WHERE name='Монтаж')='м', 'unit passthrough';
  ASSERT (SELECT unit FROM estimate_price_works WHERE name='Пуско-наладка')='шт', 'unit default for empty';
  ASSERT (SELECT price_item_id FROM estimate_price_works WHERE name='Монтаж')=pid, 'price_item_id';
  ASSERT (SELECT sort_order FROM estimate_price_works WHERE name='Пуско-наладка')=1, 'price_works sort_order';

  ASSERT (SELECT count(*) FROM estimate_price_works WHERE estimate_id=eid AND work_block_id IS NULL)=1, 'orphan price works';
  ASSERT (SELECT name FROM estimate_price_works WHERE estimate_id=eid AND work_block_id IS NULL)='Legacy работа', 'orphan name';

  ASSERT (SELECT count(*) FROM estimate_materials WHERE estimate_id=eid)=2, 'materials count';
  ASSERT (SELECT sort_order FROM estimate_materials WHERE material_name='Кран')=1, 'material sort_order';
  ASSERT (SELECT quantity FROM estimate_materials WHERE material_name='Труба')=3.5, 'material quantity';

  -- повторный вызов заменяет, а не накапливает
  PERFORM replace_estimate_children(eid, payload);
  ASSERT (SELECT count(*) FROM work_blocks WHERE estimate_id=eid)=2, 'replace: work_blocks not duplicated';
  ASSERT (SELECT count(*) FROM work_rows wr JOIN work_blocks wb ON wb.id=wr.work_block_id WHERE wb.estimate_id=eid)=2,
    'replace: work_rows not duplicated';
  ASSERT (SELECT count(*) FROM estimate_price_works WHERE estimate_id=eid)=3, 'replace: price_works not duplicated';
  ASSERT (SELECT count(*) FROM estimate_materials WHERE estimate_id=eid)=2, 'replace: materials not duplicated';

  -- пустой payload полностью очищает детей
  PERFORM replace_estimate_children(eid, '{}'::jsonb);
  ASSERT (SELECT count(*) FROM work_blocks WHERE estimate_id=eid)=0, 'empty payload clears blocks';
  ASSERT (SELECT count(*) FROM estimate_materials WHERE estimate_id=eid)=0, 'empty payload clears materials';
  ASSERT (SELECT count(*) FROM estimate_price_works WHERE estimate_id=eid)=0, 'empty payload clears price works';

  RAISE NOTICE 'OK: replace_estimate_children';
END $t$;

-- === Атомарность: ошибка внутри вызова не оставляет расчёт без детей ===
DO $t$
DECLARE eid uuid; blocks int;
BEGIN
  INSERT INTO estimates(name, estimate_number) VALUES ('atomic','') RETURNING id INTO eid;
  PERFORM replace_estimate_children(eid, jsonb_build_object(
    'work_blocks', jsonb_build_array(jsonb_build_object('description','ok','mode','manual','rows','[]'::jsonb))));
  ASSERT (SELECT count(*) FROM work_blocks WHERE estimate_id=eid)=1, 'setup';

  BEGIN
    -- невалидная категория работника → исключение внутри функции
    PERFORM replace_estimate_children(eid, jsonb_build_object(
      'work_blocks', jsonb_build_array(jsonb_build_object(
        'description','bad','mode','manual',
        'rows', jsonb_build_array(jsonb_build_object('category','Космонавт','plan_hours',1,'quantity',1,'rate',1))))));
    RAISE EXCEPTION 'ожидалось исключение';
  EXCEPTION WHEN invalid_text_representation THEN
    NULL; -- ожидаемо
  END;

  SELECT count(*) INTO blocks FROM work_blocks WHERE estimate_id=eid;
  ASSERT blocks = 1, 'после сбоя дети должны остаться прежними, а не удалиться. blocks='||blocks;
  ASSERT (SELECT description FROM work_blocks WHERE estimate_id=eid)='ok', 'старый блок сохранён';
  RAISE NOTICE 'OK: атомарность (откат при ошибке)';
END $t$;
