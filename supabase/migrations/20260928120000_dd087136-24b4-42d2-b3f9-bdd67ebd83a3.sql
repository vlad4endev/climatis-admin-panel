-- =============================================================================
--  Количество блоков в расчёте: одна и та же услуга может выполняться
--  несколько раз (например, на нескольких единицах оборудования) — сумма
--  блока должна умножаться на это количество.
-- =============================================================================

ALTER TABLE public.work_blocks
  ADD COLUMN quantity integer NOT NULL DEFAULT 1;

ALTER TABLE public.work_blocks
  ADD CONSTRAINT work_blocks_quantity_positive CHECK (quantity > 0);

-- replace_estimate_children: та же функция, что и в 20260824120000, добавлена
-- передача quantity блока (по умолчанию 1, не может быть меньше 1).
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
    INSERT INTO public.work_blocks (estimate_id, description, mode, sort_order, quantity)
    VALUES (
      p_estimate_id,
      COALESCE(v_block ->> 'description', ''),
      COALESCE(NULLIF(v_block ->> 'mode', ''), 'manual'),
      v_block_idx,
      GREATEST(COALESCE((v_block ->> 'quantity')::integer, 1), 1)
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
