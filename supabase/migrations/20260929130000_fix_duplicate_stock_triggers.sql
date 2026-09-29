-- Миграция 20260528073945 создала триггеры trg_stock_materials_insert/delete,
-- но не удалила старые trg_stock_movement_material_insert/delete из миграции
-- 20260211092020. В итоге на каждый INSERT/DELETE в stock_movement_materials
-- срабатывали ОБА триггера, и adjust_stock_on_insert/delete применялась дважды —
-- остаток на складе удваивал приход/расход (было 25, +10 → показывало 45).
DROP TRIGGER IF EXISTS trg_stock_movement_material_insert ON public.stock_movement_materials;
DROP TRIGGER IF EXISTS trg_stock_movement_material_delete ON public.stock_movement_materials;
