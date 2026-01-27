-- Update function to safely handle non-numeric suffixes
CREATE OR REPLACE FUNCTION generate_estimate_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  year_prefix := to_char(CURRENT_DATE, 'YYYY');
  
  -- Find max number for current year, only considering valid numeric suffixes
  SELECT COALESCE(MAX(
    CASE 
      WHEN SUBSTRING(estimate_number FROM 8) ~ '^\d+$' 
      THEN CAST(SUBSTRING(estimate_number FROM 8) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM public.estimates
  WHERE estimate_number LIKE 'Р-' || year_prefix || '-%';
  
  -- Format: Р-YYYY-NNNN (e.g., Р-2026-0001)
  NEW.estimate_number := 'Р-' || year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;