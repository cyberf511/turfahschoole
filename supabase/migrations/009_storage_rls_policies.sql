-- ============================================================
-- Storage RLS Policies — OWASP A04: Insecure Design
-- ============================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Certificates bucket: students can upload only to their own folder
CREATE POLICY "certificates_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Certificates bucket: students can read their own, coordinators/super_admins can read all
CREATE POLICY "certificates_select_own" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      public.has_role(ARRAY['coordinator', 'super_admin', 'superadmin'])
    )
  );

-- Site-content bucket: coordinators and super_admins can insert
CREATE POLICY "site_content_insert_coordinator" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'site-content'
    AND public.has_role(ARRAY['coordinator', 'super_admin', 'superadmin'])
  );

-- Site-content bucket: public read
CREATE POLICY "site_content_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'site-content');
