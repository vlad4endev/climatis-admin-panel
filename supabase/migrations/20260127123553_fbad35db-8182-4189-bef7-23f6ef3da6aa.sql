-- Create sequence for estimate numbering
CREATE SEQUENCE IF NOT EXISTS estimate_number_seq START WITH 1;

-- Function to generate estimate number in format 'number-year'
CREATE OR REPLACE FUNCTION generate_estimate_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next number from sequence
  next_number := nextval('estimate_number_seq');
  
  -- Format number with leading zero for single digits
  IF next_number < 10 THEN
    formatted_number := '0' || next_number::TEXT;
  ELSE
    formatted_number := next_number::TEXT;
  END IF;
  
  -- Set the estimate_number
  NEW.estimate_number := formatted_number || '-' || current_year;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate estimate number on insert
DROP TRIGGER IF EXISTS set_estimate_number ON estimates;
CREATE TRIGGER set_estimate_number
  BEFORE INSERT ON estimates
  FOR EACH ROW
  WHEN (NEW.estimate_number IS NULL OR NEW.estimate_number = '')
  EXECUTE FUNCTION generate_estimate_number();

-- Reset sequence to start after the highest existing number
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE 
      WHEN estimate_number ~ '^[0-9]+-[0-9]+$' 
      THEN SPLIT_PART(estimate_number, '-', 1)::INTEGER 
      ELSE 0 
    END
  ), 0) INTO max_num FROM estimates;
  
  PERFORM setval('estimate_number_seq', GREATEST(max_num, 1), max_num > 0);
END $$;