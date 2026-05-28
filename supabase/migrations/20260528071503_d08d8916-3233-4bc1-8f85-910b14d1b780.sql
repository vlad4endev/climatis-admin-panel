
-- 1. Restrict contacts table policies to authenticated
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can delete contacts" ON public.contacts;
CREATE POLICY "Authenticated users can view contacts" ON public.contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contacts" ON public.contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete contacts" ON public.contacts FOR DELETE TO authenticated USING (true);

-- 2. Restrict service_object_contacts policies to authenticated
DROP POLICY IF EXISTS "Authenticated users can view service_object_contacts" ON public.service_object_contacts;
DROP POLICY IF EXISTS "Authenticated users can create service_object_contacts" ON public.service_object_contacts;
DROP POLICY IF EXISTS "Authenticated users can delete service_object_contacts" ON public.service_object_contacts;
CREATE POLICY "Authenticated users can view service_object_contacts" ON public.service_object_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create service_object_contacts" ON public.service_object_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete service_object_contacts" ON public.service_object_contacts FOR DELETE TO authenticated USING (true);

-- 3. Restrict estimate_attachments table policies to authenticated
DROP POLICY IF EXISTS "Authenticated users can view estimate_attachments" ON public.estimate_attachments;
DROP POLICY IF EXISTS "Authenticated users can create estimate_attachments" ON public.estimate_attachments;
DROP POLICY IF EXISTS "Authenticated users can delete estimate_attachments" ON public.estimate_attachments;
CREATE POLICY "Authenticated users can view estimate_attachments" ON public.estimate_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create estimate_attachments" ON public.estimate_attachments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete estimate_attachments" ON public.estimate_attachments FOR DELETE TO authenticated USING (true);

-- 4. Restrict storage.objects policies for estimate-attachments bucket to authenticated
DROP POLICY IF EXISTS "Authenticated users can view estimate attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload estimate attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete estimate attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view estimate attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'estimate-attachments');
CREATE POLICY "Authenticated users can upload estimate attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'estimate-attachments');
CREATE POLICY "Authenticated users can delete estimate attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'estimate-attachments');

-- 5. Restrict activity_logs SELECT to admins (matches monitoring_logs pattern)
DROP POLICY IF EXISTS "Authenticated users can view activity_logs" ON public.activity_logs;
CREATE POLICY "Admins can view activity_logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- 6. Revoke EXECUTE on SECURITY DEFINER trigger-only functions from anon/public/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_estimate_number() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_request_number() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_assignment_number() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_stock_on_insert() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_stock_on_delete() FROM anon, authenticated, PUBLIC;

-- 7. Revoke EXECUTE on RLS helper functions from anon (still needed by authenticated for RLS evaluation)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_section_permission(uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_section_permission(uuid, text) TO authenticated;
