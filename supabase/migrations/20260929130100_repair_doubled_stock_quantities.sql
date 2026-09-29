-- Однократный ремонт данных после устранения дублирующих триггеров
-- (20260929130000_fix_duplicate_stock_triggers.sql). С 2026-05-28
-- каждая операция приход/расход применялась к current_stock дважды —
-- пересчитываем остаток из фактической истории stock_movement_materials,
-- которая дублированием не затронута.
UPDATE public.spare_parts sp
SET current_stock = COALESCE((
  SELECT SUM(CASE WHEN sm.operation_type = 'расход' THEN -smm.quantity ELSE smm.quantity END)
  FROM public.stock_movement_materials smm
  JOIN public.stock_movements sm ON sm.id = smm.stock_movement_id
  WHERE smm.spare_part_id = sp.id
), 0);
