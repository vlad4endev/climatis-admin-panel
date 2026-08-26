-- =============================================================================
--  Аудит: исправления высокого приоритета (п. 5, 6, 10)
--  1) replace_estimate_children — атомарная замена дочерних записей расчёта
--  2) Устранение гонок в генераторах номеров + исправление смещения у счетов
--  3) UNIQUE на estimates.estimate_number (с проверкой существующих дублей)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Атомарная замена дочерних записей расчёта
-- -----------------------------------------------------------------------------
-- Раньше клиент делал это 10-30 отдельными HTTP-запросами: сначала удалял все
-- блоки/строки/материалы, затем вставлял заново. Обрыв на середине оставлял
-- расчёт с удалённым содержимым. Здесь всё выполняется в одной транзакции.
--
-- Функция намеренно SECURITY INVOKER (по умолчанию): RLS применяется к правам
-- вызывающего пользователя, функция ничего не расширяет.
--
-- Формат p_payload (порядок элементов массива = sort_order):
-- {
--   "work_blocks": [{ "description": "", "mode": "manual",
--                     "rows": [{"category":"Инженер","plan_hours":0,"quantity":0,"rate":0}],
--                     "price_works": [{"price_item_id":null,"name":"","unit":"шт",
--                                      "quantity":0,"price_per_unit":0}] }],
--   "materials":   [{"material_name":"","spare_part_id":null,"quantity":0,"price_per_unit":0}],
--   "price_works": [{"price_item_id":null,"name":"","unit":"шт","quantity":0,"price_per_unit":0}]
-- }

CREATE OR REPLACE FUNCTION public.replace_estimate_children(
  p_estimate_id uuid,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_block        jsonb;
  v_block_idx    integer;
  v_new_block_id uuid;
BEGIN
  IF p_estimate_id IS NULL THEN
    RAISE EXCEPTION 'replace_estimate_children: p_estimate_id обязателен';
  END IF;

  -- Порядок удаления повторяет прежнюю логику клиента.
  -- work_rows удаляются явно (а не только каскадом) — поведение идентично старому.
  DELETE FROM public.work_rows
   WHERE work_block_id IN (
     SELECT id FROM public.work_blocks WHERE estimate_id = p_estimate_id
   );
  DELETE FROM public.work_blocks          WHERE estimate_id = p_estimate_id;
  DELETE FROM public.estimate_materials   WHERE estimate_id = p_estimate_id;
  DELETE FROM public.estimate_price_works WHERE estimate_id = p_estimate_id;

  FOR v_block, v_block_idx IN
    SELECT value, (ordinality - 1)::integer
      FROM jsonb_array_elements(COALESCE(p_payload -> 'work_blocks', '[]'::jsonb))
           WITH ORDINALITY
  LOOP
    INSERT INTO public.work_blocks (estimate_id, description, mode, sort_order)
    VALUES (
      p_estimate_id,
      COALESCE(v_block ->> 'description', ''),
      COALESCE(NULLIF(v_block ->> 'mode', ''), 'manual'),
      v_block_idx
    )
    RETURNING id INTO v_new_block_id;

    -- work_rows.quantity имеет тип INTEGER — приведение через numeric повторяет
    -- округление, которое раньше делал Postgres при вставке из PostgREST.
    INSERT INTO public.work_rows (work_block_id, category, plan_hours, quantity, rate)
    SELECT
      v_new_block_id,
      (r ->> 'category')::worker_category,
      COALESCE((r ->> 'plan_hours')::numeric, 0),
      COALESCE((r ->> 'quantity')::numeric, 0)::integer,
      COALESCE((r ->> 'rate')::numeric, 0)
    FROM jsonb_array_elements(COALESCE(v_block -> 'rows', '[]'::jsonb)) AS r;

    INSERT INTO public.estimate_price_works
      (estimate_id, work_block_id, price_item_id, name, unit, quantity, price_per_unit, sort_order)
    SELECT
      p_estimate_id,
      v_new_block_id,
      NULLIF(p ->> 'price_item_id', '')::uuid,
      COALESCE(p ->> 'name', ''),
      COALESCE(NULLIF(p ->> 'unit', ''), 'шт'),
      COALESCE((p ->> 'quantity')::numeric, 0),
      COALESCE((p ->> 'price_per_unit')::numeric, 0),
      (ord - 1)::integer
    FROM jsonb_array_elements(COALESCE(v_block -> 'price_works', '[]'::jsonb))
         WITH ORDINALITY AS t(p, ord);
  END LOOP;

  INSERT INTO public.estimate_materials
    (estimate_id, material_name, spare_part_id, quantity, price_per_unit, sort_order)
  SELECT
    p_estimate_id,
    COALESCE(m ->> 'material_name', ''),
    NULLIF(m ->> 'spare_part_id', '')::uuid,
    COALESCE((m ->> 'quantity')::numeric, 0),
    COALESCE((m ->> 'price_per_unit')::numeric, 0),
    (ord - 1)::integer
  FROM jsonb_array_elements(COALESCE(p_payload -> 'materials', '[]'::jsonb))
       WITH ORDINALITY AS t(m, ord);

  -- Прайс-работы вне блоков (legacy: work_block_id IS NULL)
  INSERT INTO public.estimate_price_works
    (estimate_id, work_block_id, price_item_id, name, unit, quantity, price_per_unit, sort_order)
  SELECT
    p_estimate_id,
    NULL,
    NULLIF(p ->> 'price_item_id', '')::uuid,
    COALESCE(p ->> 'name', ''),
    COALESCE(NULLIF(p ->> 'unit', ''), 'шт'),
    COALESCE((p ->> 'quantity')::numeric, 0),
    COALESCE((p ->> 'price_per_unit')::numeric, 0),
    (ord - 1)::integer
  FROM jsonb_array_elements(COALESCE(p_payload -> 'price_works', '[]'::jsonb))
       WITH ORDINALITY AS t(p, ord);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.replace_estimate_children(uuid, jsonb) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.replace_estimate_children(uuid, jsonb) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Генераторы номеров: блокировка от гонок + ранний выход
-- -----------------------------------------------------------------------------
-- Формат номеров и логика MAX+1 сохранены без изменений. Добавлены:
--   * ранний выход, если номер задан вручную (делает функцию идемпотентной
--     при наличии двух триггеров на таблице);
--   * pg_advisory_xact_lock — два параллельных INSERT больше не получают
--     одинаковый номер;
--   * regex-проверка суффикса перед CAST (иначе «ручной» номер ломал вставки).

CREATE OR REPLACE FUNCTION public.generate_estimate_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  IF NEW.estimate_number IS NOT NULL AND btrim(NEW.estimate_number) <> '' THEN
    RETURN NEW;
  END IF;

  year_prefix := to_char(CURRENT_DATE, 'YYYY');
  PERFORM pg_advisory_xact_lock(hashtext('estimates_estimate_number_' || year_prefix));

  -- Формат: Р-YYYY-NNNN, префикс 'Р-YYYY-' занимает 7 символов
  SELECT COALESCE(MAX(
    CASE
      WHEN SUBSTRING(estimate_number FROM 8) ~ '^\d+$'
      THEN CAST(SUBSTRING(estimate_number FROM 8) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM public.estimates
  WHERE estimate_number LIKE 'Р-' || year_prefix || '-%';

  -- LPAD(...,4) сам по себе ОБРЕЗАЕТ номер: для 10000 он вернул бы '1000'
  -- и создал коллизию с уже существующим номером. Дополняем нулями только
  -- то, что короче 4 знаков, формат 0001..9999 при этом не меняется.
  NEW.estimate_number := 'Р-' || year_prefix || '-' ||
    CASE WHEN length(next_num::TEXT) < 4
         THEN LPAD(next_num::TEXT, 4, '0')
         ELSE next_num::TEXT
    END;
  RETURN NEW;
END;
$$;

-- ВНИМАНИЕ: здесь же исправлено смещение SUBSTRING. Было FROM 5, что для номера
-- 'С-2026-0001' давало '26-0001' и роняло CAST — то есть второй счёт в году
-- вообще не мог быть создан. Префикс 'С-YYYY-' занимает 7 символов → FROM 8.
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND btrim(NEW.invoice_number) <> '' THEN
    RETURN NEW;
  END IF;

  year_prefix := to_char(CURRENT_DATE, 'YYYY');
  PERFORM pg_advisory_xact_lock(hashtext('invoices_invoice_number_' || year_prefix));

  SELECT COALESCE(MAX(
    CASE
      WHEN SUBSTRING(invoice_number FROM 8) ~ '^\d+$'
      THEN CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE invoice_number LIKE 'С-' || year_prefix || '-%';

  -- LPAD(...,4) сам по себе ОБРЕЗАЕТ номер: для 10000 он вернул бы '1000'
  -- и создал коллизию с уже существующим номером. Дополняем нулями только
  -- то, что короче 4 знаков, формат 0001..9999 при этом не меняется.
  NEW.invoice_number := 'С-' || year_prefix || '-' ||
    CASE WHEN length(next_num::TEXT) < 4
         THEN LPAD(next_num::TEXT, 4, '0')
         ELSE next_num::TEXT
    END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_assignment_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  IF NEW.assignment_number IS NOT NULL AND btrim(NEW.assignment_number) <> '' THEN
    RETURN NEW;
  END IF;

  year_prefix := to_char(CURRENT_DATE, 'YYYY');
  PERFORM pg_advisory_xact_lock(hashtext('assignments_assignment_number_' || year_prefix));

  SELECT COALESCE(MAX(
    CASE
      WHEN SUBSTRING(assignment_number FROM 8) ~ '^\d+$'
      THEN CAST(SUBSTRING(assignment_number FROM 8) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM public.assignments
  WHERE assignment_number LIKE 'Н-' || year_prefix || '-%';

  -- LPAD(...,4) сам по себе ОБРЕЗАЕТ номер: для 10000 он вернул бы '1000'
  -- и создал коллизию с уже существующим номером. Дополняем нулями только
  -- то, что короче 4 знаков, формат 0001..9999 при этом не меняется.
  NEW.assignment_number := 'Н-' || year_prefix || '-' ||
    CASE WHEN length(next_num::TEXT) < 4
         THEN LPAD(next_num::TEXT, 4, '0')
         ELSE next_num::TEXT
    END;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. UNIQUE на estimate_number
-- -----------------------------------------------------------------------------
-- У requests/invoices/assignments UNIQUE уже есть, у estimates не было — гонка
-- приводила к молча продублированным номерам расчётов.
-- Индекс создаётся только если дублей нет: иначе миграция упала бы на боевых
-- данных. При наличии дублей выводится предупреждение со списком.
DO $$
DECLARE
  dup_list text;
BEGIN
  SELECT string_agg(estimate_number || ' (x' || cnt || ')', ', ')
  INTO dup_list
  FROM (
    SELECT estimate_number, count(*) AS cnt
    FROM public.estimates
    GROUP BY estimate_number
    HAVING count(*) > 1
  ) d;

  IF dup_list IS NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS estimates_estimate_number_key
      ON public.estimates (estimate_number);
  ELSE
    RAISE WARNING 'UNIQUE на estimates.estimate_number НЕ создан: найдены дубли: %. Исправьте номера вручную и выполните: CREATE UNIQUE INDEX estimates_estimate_number_key ON public.estimates (estimate_number);', dup_list;
  END IF;
END $$;
