-- Обновляем функцию генерации номера заявки
-- Формат: номер-год (например, 01-2026, 165-2026)
-- Номер сбрасывается 1 января каждого года

CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    current_year TEXT;
    next_num INTEGER;
BEGIN
    current_year := to_char(CURRENT_DATE, 'YYYY');
    
    -- Находим максимальный номер за текущий год
    SELECT COALESCE(MAX(CAST(SPLIT_PART(request_number, '-', 1) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.requests
    WHERE request_number LIKE '%-' || current_year;
    
    -- Формат: номер-год (например, 01-2026 или 165-2026)
    NEW.request_number := LPAD(next_num::TEXT, 2, '0') || '-' || current_year;
    RETURN NEW;
END;
$function$;