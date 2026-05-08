-- ============================================================
-- Fix RLS Policies — OWASP A01: Broken Access Control
-- ============================================================

-- 1. Fix profiles SELECT: restrict students to own row only
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_coordinator" ON profiles;
CREATE POLICY "profiles_select_own_or_coordinator" ON profiles
  FOR SELECT
  USING (
    auth.jwt()->>'sub' = id
    OR
    public.has_role(ARRAY['coordinator', 'super_admin', 'superadmin'])
  );

-- 2. Fix profiles INSERT: ensure user can only create their own profile
DROP POLICY IF EXISTS "profiles_insert_service_role" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.jwt()->>'sub' = id);

-- 3. Fix notifications INSERT: only allow inserting notifications for yourself
DROP POLICY IF EXISTS "notifications_insert_service" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_own_or_coordinator" ON notifications;
CREATE POLICY "notifications_insert_own_or_coordinator" ON notifications
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'sub' = user_id
    OR
    public.has_role(ARRAY['coordinator', 'super_admin', 'superadmin'])
  );

-- 4. Fix opportunities INSERT: validate created_by matches caller
DROP POLICY IF EXISTS "opportunities_insert_coordinator" ON opportunities;
CREATE POLICY "opportunities_insert_coordinator" ON opportunities
  FOR INSERT
  WITH CHECK (
    public.has_role(ARRAY['coordinator', 'super_admin', 'superadmin'])
    AND
    auth.jwt()->>'sub' = created_by
  );

-- 5. Change SECURITY DEFINER to SECURITY INVOKER on role functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := public.get_user_role();
  RETURN user_role = ANY(required_roles);
END;
$$;
