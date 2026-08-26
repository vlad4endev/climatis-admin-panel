-- =============================================================================
--  Проверка порядка операций при редактировании складской операции
--  (src/hooks/useStockMovements.ts → useUpdateStockMovement)
--
--  Запуск:
--    createdb stock_check
--    psql -d stock_check -v ON_ERROR_STOP=1 -f supabase/tests/stock_movement_update_order_test.sql
--    dropdb stock_check
--
--  Триггеры adjust_stock_on_insert/delete берут operation_type из родительской
--  строки stock_movements. Поэтому сторно старых материалов обязано выполняться
--  ДО обновления типа операции. Тест воспроизводит оба порядка и показывает,
--  что даёт каждый. Успех = строки NOTICE «OK: ...» без ошибок.
-- =============================================================================

CREATE TYPE public.operation_type AS ENUM ('приход','расход','возврат');

CREATE TABLE public.spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  current_stock numeric(10,2) DEFAULT 0
);
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_date date NOT NULL DEFAULT CURRENT_DATE,
  operation_type operation_type NOT NULL,
  comment text DEFAULT ''
);
CREATE TABLE public.stock_movement_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_movement_id uuid NOT NULL REFERENCES public.stock_movements(id) ON DELETE CASCADE,
  spare_part_id uuid NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  quantity numeric(10,2) NOT NULL DEFAULT 0
);

-- Функции скопированы из миграции 20260211092020 без изменений
CREATE OR REPLACE FUNCTION public.adjust_stock_on_insert()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE op_type text; delta numeric;
BEGIN
  SELECT operation_type INTO op_type FROM public.stock_movements WHERE id = NEW.stock_movement_id;
  IF op_type = 'расход' THEN delta := -NEW.quantity; ELSE delta := NEW.quantity; END IF;
  UPDATE public.spare_parts SET current_stock = COALESCE(current_stock,0) + delta WHERE id = NEW.spare_part_id;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.adjust_stock_on_delete()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE op_type text; delta numeric;
BEGIN
  SELECT operation_type INTO op_type FROM public.stock_movements WHERE id = OLD.stock_movement_id;
  IF op_type = 'расход' THEN delta := OLD.quantity; ELSE delta := -OLD.quantity; END IF;
  UPDATE public.spare_parts SET current_stock = COALESCE(current_stock,0) + delta WHERE id = OLD.spare_part_id;
  RETURN OLD;
END $$;

CREATE TRIGGER trg_stock_materials_insert AFTER INSERT ON public.stock_movement_materials
  FOR EACH ROW EXECUTE FUNCTION public.adjust_stock_on_insert();
CREATE TRIGGER trg_stock_materials_delete AFTER DELETE ON public.stock_movement_materials
  FOR EACH ROW EXECUTE FUNCTION public.adjust_stock_on_delete();

DO $t$
DECLARE
  part uuid; mv uuid; stock numeric;
BEGIN
  -- ---------- СТАРЫЙ порядок: сначала родитель, потом материалы ----------
  INSERT INTO spare_parts(name, current_stock) VALUES ('Фильтр', 0) RETURNING id INTO part;
  INSERT INTO stock_movements(operation_type) VALUES ('приход') RETURNING id INTO mv;
  INSERT INTO stock_movement_materials(stock_movement_id, spare_part_id, quantity) VALUES (mv, part, 10);

  SELECT current_stock INTO stock FROM spare_parts WHERE id = part;
  ASSERT stock = 10, 'приход 10 должен дать остаток 10, получено '||stock;

  UPDATE stock_movements SET operation_type = 'расход' WHERE id = mv;      -- <- было первым
  DELETE FROM stock_movement_materials WHERE stock_movement_id = mv;
  INSERT INTO stock_movement_materials(stock_movement_id, spare_part_id, quantity) VALUES (mv, part, 10);

  SELECT current_stock INTO stock FROM spare_parts WHERE id = part;
  ASSERT stock = 10, 'ожидалось воспроизведение баги (10 вместо -10), получено '||stock;
  RAISE NOTICE 'OK: старый порядок воспроизводит расхождение: остаток % вместо -10', stock;

  -- ---------- НОВЫЙ порядок: сначала материалы, потом родитель ----------
  INSERT INTO spare_parts(name, current_stock) VALUES ('Фильтр 2', 0) RETURNING id INTO part;
  INSERT INTO stock_movements(operation_type) VALUES ('приход') RETURNING id INTO mv;
  INSERT INTO stock_movement_materials(stock_movement_id, spare_part_id, quantity) VALUES (mv, part, 10);

  DELETE FROM stock_movement_materials WHERE stock_movement_id = mv;      -- <- сторно по СТАРОМУ типу
  UPDATE stock_movements SET operation_type = 'расход' WHERE id = mv;
  INSERT INTO stock_movement_materials(stock_movement_id, spare_part_id, quantity) VALUES (mv, part, 10);

  SELECT current_stock INTO stock FROM spare_parts WHERE id = part;
  ASSERT stock = -10, 'после смены на расход 10 остаток должен быть -10, получено '||stock;
  RAISE NOTICE 'OK: новый порядок даёт верный остаток %', stock;

  -- ---------- Новый порядок при смене только количества ----------
  INSERT INTO spare_parts(name, current_stock) VALUES ('Фильтр 3', 100) RETURNING id INTO part;
  INSERT INTO stock_movements(operation_type) VALUES ('расход') RETURNING id INTO mv;
  INSERT INTO stock_movement_materials(stock_movement_id, spare_part_id, quantity) VALUES (mv, part, 5);
  SELECT current_stock INTO stock FROM spare_parts WHERE id = part;
  ASSERT stock = 95, 'расход 5 из 100 -> 95, получено '||stock;

  DELETE FROM stock_movement_materials WHERE stock_movement_id = mv;
  UPDATE stock_movements SET operation_type = 'расход' WHERE id = mv;
  INSERT INTO stock_movement_materials(stock_movement_id, spare_part_id, quantity) VALUES (mv, part, 8);
  SELECT current_stock INTO stock FROM spare_parts WHERE id = part;
  ASSERT stock = 92, 'расход изменён с 5 на 8 -> 92, получено '||stock;
  RAISE NOTICE 'OK: смена количества без смены типа операции';
END $t$;
