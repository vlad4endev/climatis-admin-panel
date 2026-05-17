CREATE OR REPLACE FUNCTION public._tmp_dump_auth_users()
RETURNS TABLE(sql text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    'INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('
    || quote_nullable(instance_id) || ', '
    || quote_literal(id) || ', '
    || quote_nullable(aud) || ', '
    || quote_nullable(role) || ', '
    || quote_nullable(email) || ', '
    || quote_nullable(encrypted_password) || ', '
    || quote_nullable(email_confirmed_at) || ', '
    || quote_nullable(invited_at) || ', '
    || quote_nullable(confirmation_token) || ', '
    || quote_nullable(confirmation_sent_at) || ', '
    || quote_nullable(recovery_token) || ', '
    || quote_nullable(recovery_sent_at) || ', '
    || quote_nullable(email_change_token_new) || ', '
    || quote_nullable(email_change) || ', '
    || quote_nullable(email_change_sent_at) || ', '
    || quote_nullable(last_sign_in_at) || ', '
    || quote_nullable(raw_app_meta_data::text) || '::jsonb, '
    || quote_nullable(raw_user_meta_data::text) || '::jsonb, '
    || COALESCE(is_super_admin::text, 'NULL') || ', '
    || quote_nullable(created_at) || ', '
    || quote_nullable(updated_at) || ', '
    || quote_nullable(phone) || ', '
    || quote_nullable(phone_confirmed_at) || ', '
    || quote_nullable(phone_change) || ', '
    || quote_nullable(phone_change_token) || ', '
    || quote_nullable(phone_change_sent_at) || ', '
    || quote_nullable(email_change_token_current) || ', '
    || COALESCE(email_change_confirm_status::text, 'NULL') || ', '
    || quote_nullable(banned_until) || ', '
    || quote_nullable(reauthentication_token) || ', '
    || quote_nullable(reauthentication_sent_at) || ', '
    || COALESCE(is_sso_user::text, 'false') || ', '
    || quote_nullable(deleted_at) || ', '
    || COALESCE(is_anonymous::text, 'false')
    || ') ON CONFLICT (id) DO NOTHING;'
  FROM auth.users
  ORDER BY created_at;
$$;
REVOKE ALL ON FUNCTION public._tmp_dump_auth_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._tmp_dump_auth_users() TO anon, authenticated, service_role;