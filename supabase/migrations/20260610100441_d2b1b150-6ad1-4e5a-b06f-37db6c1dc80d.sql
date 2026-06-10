ALTER TABLE public.work_blocks ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'manual';
ALTER TABLE public.work_blocks DROP CONSTRAINT IF EXISTS work_blocks_mode_check;
ALTER TABLE public.work_blocks ADD CONSTRAINT work_blocks_mode_check CHECK (mode IN ('manual','price'));