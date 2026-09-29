-- =============================================================================
--  Бэкфилл "осиротевших" прайс-работ (estimate_price_works.work_block_id IS
--  NULL), оставшихся с тех пор как work_block_id был добавлен (миграция
--  20260610094041) без блока, к которому они относятся.
--
--  EstimateForm.tsx читает работы по прайсу только из workBlocks (см.
--  getCustomerWorkLines/calculateEstimateTotals в src/types/estimate.ts) —
--  верхнеуровневый Estimate.priceWorks нигде не используется. Из-за этого у
--  расчётов с такими "осиротевшими" строками стоимость работ по прайсу
--  показывалась нулевой и в самом расчёте, и в выгрузке в Word (getDocumentContent
--  в EstimateForm.tsx), а при следующем сохранении replace_estimate_children
--  удалял их безвозвратно (EstimateForm никогда не передаёт top-level
--  priceWorks обратно).
--
--  Для каждого затронутого расчёта создаём один блок в режиме "price" и
--  переносим в него осиротевшие строки — без потери данных.
-- =============================================================================

DO $$
DECLARE
  r RECORD;
  v_block_id uuid;
BEGIN
  FOR r IN
    SELECT DISTINCT estimate_id
    FROM public.estimate_price_works
    WHERE work_block_id IS NULL
  LOOP
    INSERT INTO public.work_blocks (estimate_id, description, mode, sort_order, quantity)
    VALUES (
      r.estimate_id,
      'Работы по прайсу',
      'price',
      COALESCE((SELECT MAX(sort_order) + 1 FROM public.work_blocks WHERE estimate_id = r.estimate_id), 0),
      1
    )
    RETURNING id INTO v_block_id;

    UPDATE public.estimate_price_works
    SET work_block_id = v_block_id
    WHERE estimate_id = r.estimate_id
      AND work_block_id IS NULL;
  END LOOP;
END $$;
