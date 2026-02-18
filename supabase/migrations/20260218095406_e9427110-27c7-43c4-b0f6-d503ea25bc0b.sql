
CREATE OR REPLACE FUNCTION public.generate_assignment_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    year_prefix TEXT;
    next_num INTEGER;
BEGIN
    -- Only auto-generate if assignment_number is empty or null
    IF NEW.assignment_number IS NOT NULL AND NEW.assignment_number <> '' THEN
        RETURN NEW;
    END IF;

    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(assignment_number FROM 8) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.assignments
    WHERE assignment_number LIKE 'Н-' || year_prefix || '-%';
    NEW.assignment_number := 'Н-' || year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$function$;
