CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    current_year TEXT;
    next_num INTEGER;
BEGIN
    IF NEW.request_number IS NOT NULL AND btrim(NEW.request_number) <> '' THEN
        RETURN NEW;
    END IF;

    current_year := to_char(CURRENT_DATE, 'YYYY');

    -- Prevent two simultaneous inserts from receiving the same request number.
    PERFORM pg_advisory_xact_lock(hashtext('requests_request_number_' || current_year));

    SELECT COALESCE(MAX(
        CASE
            WHEN split_part(request_number, '-', 1) ~ '^\d+$'
            THEN split_part(request_number, '-', 1)::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO next_num
    FROM public.requests
    WHERE request_number LIKE '%-' || current_year;

    NEW.request_number := LPAD(next_num::TEXT, 2, '0') || '-' || current_year;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generate_request_number_trigger ON public.requests;
DROP TRIGGER IF EXISTS trg_requests_number ON public.requests;

CREATE TRIGGER trg_requests_number
BEFORE INSERT ON public.requests
FOR EACH ROW
WHEN (NEW.request_number IS NULL OR btrim(NEW.request_number) = '')
EXECUTE FUNCTION public.generate_request_number();