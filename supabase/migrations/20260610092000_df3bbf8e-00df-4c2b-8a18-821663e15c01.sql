
-- 1) Справочник прайса работ
CREATE TABLE public.work_price_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'шт',
  price numeric NOT NULL DEFAULT 0,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_price_list TO authenticated;
GRANT ALL ON public.work_price_list TO service_role;

ALTER TABLE public.work_price_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view price list"
  ON public.work_price_list FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert price list"
  ON public.work_price_list FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update price list"
  ON public.work_price_list FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete price list"
  ON public.work_price_list FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_work_price_list_updated_at
  BEFORE UPDATE ON public.work_price_list
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_work_price_list_active ON public.work_price_list (is_active) WHERE deleted_at IS NULL;

-- 2) Позиции прайс-работ в расчёте
CREATE TABLE public.estimate_price_works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  price_item_id uuid REFERENCES public.work_price_list(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'шт',
  quantity numeric NOT NULL DEFAULT 0,
  price_per_unit numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimate_price_works TO authenticated;
GRANT ALL ON public.estimate_price_works TO service_role;

ALTER TABLE public.estimate_price_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view estimate price works"
  ON public.estimate_price_works FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert estimate price works"
  ON public.estimate_price_works FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update estimate price works"
  ON public.estimate_price_works FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete estimate price works"
  ON public.estimate_price_works FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_estimate_price_works_updated_at
  BEFORE UPDATE ON public.estimate_price_works
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_estimate_price_works_estimate_id ON public.estimate_price_works (estimate_id);
