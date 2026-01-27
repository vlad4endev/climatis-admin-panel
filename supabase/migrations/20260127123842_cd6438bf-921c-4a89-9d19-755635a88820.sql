-- Update function to generate estimate number in format 'Р-YYYY-NNNN'
CREATE OR REPLACE FUNCTION generate_estimate_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  year_prefix := to_char(CURRENT_DATE, 'YYYY');
  
  -- Find max number for current year
  SELECT COALESCE(MAX(CAST(SUBSTRING(estimate_number FROM 8) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.estimates
  WHERE estimate_number LIKE 'Р-' || year_prefix || '-%';
  
  -- Format: Р-YYYY-NNNN (e.g., Р-2026-0001)
  NEW.estimate_number := 'Р-' || year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recreate trigger
DROP TRIGGER IF EXISTS set_estimate_number ON estimates;
CREATE TRIGGER set_estimate_number
  BEFORE INSERT ON estimates
  FOR EACH ROW
  WHEN (NEW.estimate_number IS NULL OR NEW.estimate_number = '')
  EXECUTE FUNCTION generate_estimate_number();

-- Drop old sequence (not needed anymore)
DROP SEQUENCE IF EXISTS estimate_number_seq;