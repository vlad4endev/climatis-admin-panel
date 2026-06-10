ALTER TABLE public.estimate_price_works
  ADD COLUMN IF NOT EXISTS work_block_id uuid REFERENCES public.work_blocks(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_estimate_price_works_work_block_id
  ON public.estimate_price_works(work_block_id);