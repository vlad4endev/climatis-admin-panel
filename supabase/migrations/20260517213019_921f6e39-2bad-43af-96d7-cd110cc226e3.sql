CREATE OR REPLACE FUNCTION public._tmp_dump_table(tbl text) RETURNS SETOF text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  cols text;
  col_array text;
  q text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position),
         string_agg(quote_literal(column_name), ',' ORDER BY ordinal_position)
  INTO cols, col_array
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name=tbl;

  q := format($f$
    SELECT 'INSERT INTO public.%I (' || %L || ') VALUES (' ||
      (SELECT string_agg(
        CASE
          WHEN r.j->c IS NULL OR jsonb_typeof(r.j->c)='null' THEN 'NULL'
          WHEN jsonb_typeof(r.j->c) IN ('object','array') THEN quote_literal(r.j->>c) || '::jsonb'
          WHEN jsonb_typeof(r.j->c)='boolean' THEN r.j->>c
          WHEN jsonb_typeof(r.j->c)='number' THEN r.j->>c
          ELSE quote_literal(r.j->>c)
        END, ',' ORDER BY o)
       FROM unnest(ARRAY[%s]) WITH ORDINALITY AS u(c,o)
      ) || ') ON CONFLICT DO NOTHING;'
    FROM public.%I t, LATERAL (SELECT to_jsonb(t) AS j) r
  $f$, tbl, cols, col_array, tbl);
  RETURN QUERY EXECUTE q;
END $$;
GRANT EXECUTE ON FUNCTION public._tmp_dump_table(text) TO anon, authenticated, service_role;