
-- Function to adjust stock when a stock_movement_material is inserted
CREATE OR REPLACE FUNCTION public.adjust_stock_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  op_type text;
  delta numeric;
BEGIN
  -- Get the operation type from the parent stock_movements row
  SELECT operation_type INTO op_type
  FROM public.stock_movements
  WHERE id = NEW.stock_movement_id;

  -- Calculate delta: приход/возврат = +, расход = -
  IF op_type = 'расход' THEN
    delta := -NEW.quantity;
  ELSE
    delta := NEW.quantity;
  END IF;

  -- Update current_stock in spare_parts
  UPDATE public.spare_parts
  SET current_stock = COALESCE(current_stock, 0) + delta
  WHERE id = NEW.spare_part_id;

  RETURN NEW;
END;
$$;

-- Function to reverse stock adjustment when a stock_movement_material is deleted
CREATE OR REPLACE FUNCTION public.adjust_stock_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  op_type text;
  delta numeric;
BEGIN
  -- Get the operation type from the parent stock_movements row
  SELECT operation_type INTO op_type
  FROM public.stock_movements
  WHERE id = OLD.stock_movement_id;

  -- Reverse: if it was расход (decreased), now increase; if приход/возврат (increased), now decrease
  IF op_type = 'расход' THEN
    delta := OLD.quantity;
  ELSE
    delta := -OLD.quantity;
  END IF;

  UPDATE public.spare_parts
  SET current_stock = COALESCE(current_stock, 0) + delta
  WHERE id = OLD.spare_part_id;

  RETURN OLD;
END;
$$;

-- Trigger on INSERT into stock_movement_materials
CREATE TRIGGER trg_stock_movement_material_insert
AFTER INSERT ON public.stock_movement_materials
FOR EACH ROW
EXECUTE FUNCTION public.adjust_stock_on_insert();

-- Trigger on DELETE from stock_movement_materials
CREATE TRIGGER trg_stock_movement_material_delete
AFTER DELETE ON public.stock_movement_materials
FOR EACH ROW
EXECUTE FUNCTION public.adjust_stock_on_delete();
