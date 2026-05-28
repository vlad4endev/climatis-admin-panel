
DROP TRIGGER IF EXISTS trg_requests_number ON public.requests;
CREATE TRIGGER trg_requests_number BEFORE INSERT ON public.requests
FOR EACH ROW WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
EXECUTE FUNCTION public.generate_request_number();

DROP TRIGGER IF EXISTS trg_estimates_number ON public.estimates;
CREATE TRIGGER trg_estimates_number BEFORE INSERT ON public.estimates
FOR EACH ROW WHEN (NEW.estimate_number IS NULL OR NEW.estimate_number = '')
EXECUTE FUNCTION public.generate_estimate_number();

DROP TRIGGER IF EXISTS trg_invoices_number ON public.invoices;
CREATE TRIGGER trg_invoices_number BEFORE INSERT ON public.invoices
FOR EACH ROW WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
EXECUTE FUNCTION public.generate_invoice_number();

DROP TRIGGER IF EXISTS trg_assignments_number ON public.assignments;
CREATE TRIGGER trg_assignments_number BEFORE INSERT ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.generate_assignment_number();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','contacts','service_objects','requests','documents','estimates','invoices','assignments','employees','teams','spare_parts','stock_movements','warehouse_categories','tasks','profiles','section_permissions']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_stock_materials_insert ON public.stock_movement_materials;
CREATE TRIGGER trg_stock_materials_insert AFTER INSERT ON public.stock_movement_materials FOR EACH ROW EXECUTE FUNCTION public.adjust_stock_on_insert();

DROP TRIGGER IF EXISTS trg_stock_materials_delete ON public.stock_movement_materials;
CREATE TRIGGER trg_stock_materials_delete AFTER DELETE ON public.stock_movement_materials FOR EACH ROW EXECUTE FUNCTION public.adjust_stock_on_delete();
