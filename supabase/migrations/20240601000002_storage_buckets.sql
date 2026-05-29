-- Storage buckets for document management
-- Run this after storage extension is enabled

-- Create storage buckets for different document types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('compliance-documents', 'compliance-documents', false, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']),
  ('financial-documents', 'financial-documents', false, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']),
  ('audit-reports', 'audit-reports', false, 52428800, ARRAY['application/pdf']),
  ('board-documents', 'board-documents', false, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for storage buckets
-- Users can only access documents for schools they have access to

-- Helper function to check school access for storage
CREATE OR REPLACE FUNCTION storage.check_school_access(bucket_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  school_id_from_path text;
  user_auth_id text;
BEGIN
  -- Extract school_id from path (first segment)
  school_id_from_path := split_part(bucket_path, '/', 1);

  -- Get current user's auth id
  user_auth_id := auth.uid()::text;

  IF user_auth_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user has access to this school
  RETURN EXISTS (
    SELECT 1 FROM public.school_memberships sm
    JOIN public.users u ON sm.user_id = u.id
    WHERE u.auth_id = user_auth_id
    AND sm.school_id::text = school_id_from_path
    AND sm.is_active = true
  ) OR EXISTS (
    -- Authorizer members can access their portfolio schools' documents
    SELECT 1 FROM public.authorizer_memberships am
    JOIN public.users u ON am.user_id = u.id
    JOIN public.schools s ON s.authorizer_id = am.authorizer_id
    WHERE u.auth_id = user_auth_id
    AND s.id::text = school_id_from_path
    AND am.is_active = true
  );
END;
$$;

-- Compliance documents bucket policies
CREATE POLICY "School members can view compliance docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND storage.check_school_access(name)
);

CREATE POLICY "School admins can upload compliance docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents'
  AND storage.check_school_access(name)
);

CREATE POLICY "School admins can delete compliance docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND storage.check_school_access(name)
);

-- Financial documents bucket policies
CREATE POLICY "School members can view financial docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'financial-documents'
  AND storage.check_school_access(name)
);

CREATE POLICY "School admins can upload financial docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'financial-documents'
  AND storage.check_school_access(name)
);

CREATE POLICY "School admins can delete financial docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'financial-documents'
  AND storage.check_school_access(name)
);

-- Audit reports bucket policies
CREATE POLICY "School members can view audit reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audit-reports'
  AND storage.check_school_access(name)
);

CREATE POLICY "School admins can upload audit reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audit-reports'
  AND storage.check_school_access(name)
);

CREATE POLICY "School admins can delete audit reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audit-reports'
  AND storage.check_school_access(name)
);

-- Board documents bucket policies
CREATE POLICY "School members can view board docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'board-documents'
  AND storage.check_school_access(name)
);

CREATE POLICY "School admins can upload board docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'board-documents'
  AND storage.check_school_access(name)
);

CREATE POLICY "School admins can delete board docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'board-documents'
  AND storage.check_school_access(name)
);

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
