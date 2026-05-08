-- ============================================================
-- Audit Logs Table Migration — OWASP A09: Logging Failures
-- ============================================================

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  target_id TEXT,
  target_email TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admins can read audit logs
CREATE POLICY "audit_logs_select_super_admin" ON public.audit_logs
  FOR SELECT
  USING (public.has_role(ARRAY['super_admin', 'superadmin']));

-- Authenticated users with coordinator/super_admin roles can insert
CREATE POLICY "audit_logs_insert_coordinator" ON public.audit_logs
  FOR INSERT
  WITH CHECK (public.has_role(ARRAY['coordinator', 'super_admin', 'superadmin']));

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to tables that have updated_at column
CREATE TRIGGER set_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
