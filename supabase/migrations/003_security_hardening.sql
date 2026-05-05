-- ============================================================
-- Volunteer Management Platform — Security Hardening Migration
-- Fixes RLS policies to properly check roles via database function
-- ============================================================

-- Helper function: returns the role of the authenticated user
-- Used in RLS policies since JWT doesn't contain role (managed by Clerk)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.jwt()->>'sub';
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: check if user has one of the given roles
CREATE OR REPLACE FUNCTION public.has_role(allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role() = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing insecure policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

DROP POLICY IF EXISTS "Anyone can read active opportunities" ON opportunities;
DROP POLICY IF EXISTS "Coordinators can insert opportunities" ON opportunities;
DROP POLICY IF EXISTS "Coordinators can update opportunities" ON opportunities;

DROP POLICY IF EXISTS "Students can read own applications" ON applications;
DROP POLICY IF EXISTS "Students can insert applications" ON applications;
DROP POLICY IF EXISTS "Reviewers can update applications" ON applications;

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Drop new policies (for idempotent re-runs)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_service_role" ON profiles;

DROP POLICY IF EXISTS "opportunities_select_active_or_coordinator" ON opportunities;
DROP POLICY IF EXISTS "opportunities_insert_coordinator" ON opportunities;
DROP POLICY IF EXISTS "opportunities_update_coordinator" ON opportunities;
DROP POLICY IF EXISTS "opportunities_delete_coordinator" ON opportunities;

DROP POLICY IF EXISTS "applications_select_own_or_coordinator" ON applications;
DROP POLICY IF EXISTS "applications_insert_student" ON applications;
DROP POLICY IF EXISTS "applications_update_student_or_coordinator" ON applications;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_service" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

-- ============================================================
-- PROFILES
-- ============================================================

-- Everyone can read profiles (needed for display names, avatars)
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
USING (true);

-- Users can update their own profile only
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
USING (auth.jwt()->>'sub' = id);

-- Service role can insert profiles (used by webhook)
CREATE POLICY "profiles_insert_service_role" ON profiles FOR INSERT
WITH CHECK (true);

-- ============================================================
-- OPPORTUNITIES
-- ============================================================

-- Anyone can read active opportunities; coordinators can read all
CREATE POLICY "opportunities_select_active_or_coordinator" ON opportunities FOR SELECT
USING (
  is_active = true
  OR public.has_role(ARRAY['coordinator', 'super_admin'])
);

-- Only coordinators/super_admin can insert
CREATE POLICY "opportunities_insert_coordinator" ON opportunities FOR INSERT
WITH CHECK (public.has_role(ARRAY['coordinator', 'super_admin']));

-- Only coordinators/super_admin can update
CREATE POLICY "opportunities_update_coordinator" ON opportunities FOR UPDATE
USING (public.has_role(ARRAY['coordinator', 'super_admin']));

-- Only coordinators/super_admin can delete
CREATE POLICY "opportunities_delete_coordinator" ON opportunities FOR DELETE
USING (public.has_role(ARRAY['coordinator', 'super_admin']));

-- ============================================================
-- APPLICATIONS
-- ============================================================

-- Students can read own; coordinators can read all
CREATE POLICY "applications_select_own_or_coordinator" ON applications FOR SELECT
USING (
  auth.jwt()->>'sub' = student_id
  OR public.has_role(ARRAY['coordinator', 'super_admin'])
);

-- Students can insert own applications
CREATE POLICY "applications_insert_student" ON applications FOR INSERT
WITH CHECK (auth.jwt()->>'sub' = student_id);

-- Students can update own (certificate upload); coordinators can update all
CREATE POLICY "applications_update_student_or_coordinator" ON applications FOR UPDATE
USING (
  auth.jwt()->>'sub' = student_id
  OR public.has_role(ARRAY['coordinator', 'super_admin'])
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

-- Users can only read their own notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
USING (auth.jwt()->>'sub' = user_id);

-- System/service role can insert notifications
CREATE POLICY "notifications_insert_service" ON notifications FOR INSERT
WITH CHECK (true);

-- Users can only update their own (mark as read)
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
USING (auth.jwt()->>'sub' = user_id);

-- ============================================================
-- PRE_REGISTERED_STUDENTS
-- ============================================================

ALTER TABLE pre_registered_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pre_registered_select_coordinator" ON pre_registered_students;
DROP POLICY IF EXISTS "pre_registered_insert_coordinator" ON pre_registered_students;
DROP POLICY IF EXISTS "pre_registered_update_coordinator" ON pre_registered_students;
DROP POLICY IF EXISTS "pre_registered_delete_coordinator" ON pre_registered_students;

CREATE POLICY "pre_registered_select_coordinator" ON pre_registered_students FOR SELECT
USING (public.has_role(ARRAY['coordinator', 'super_admin']));

CREATE POLICY "pre_registered_insert_coordinator" ON pre_registered_students FOR INSERT
WITH CHECK (public.has_role(ARRAY['coordinator', 'super_admin']));

CREATE POLICY "pre_registered_update_coordinator" ON pre_registered_students FOR UPDATE
USING (public.has_role(ARRAY['coordinator', 'super_admin']));

CREATE POLICY "pre_registered_delete_coordinator" ON pre_registered_students FOR DELETE
USING (public.has_role(ARRAY['coordinator', 'super_admin']));
