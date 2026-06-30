-- Create demand-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'demand-documents',
  'demand-documents',
  true,
  52428800,  -- 50 MB
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policies
DROP POLICY IF EXISTS "Public read demand-documents"              ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload demand-documents"     ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update demand-documents"     ON storage.objects;
DROP POLICY IF EXISTS "Service role full access demand-documents" ON storage.objects;

-- Public read (clients and admins can view files via URL)
CREATE POLICY "Public read demand-documents"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'demand-documents');

-- Authenticated users can upload
CREATE POLICY "Authenticated upload demand-documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'demand-documents');

-- Authenticated users can update/replace
CREATE POLICY "Authenticated update demand-documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'demand-documents');

-- Service role full access
CREATE POLICY "Service role full access demand-documents"
  ON storage.objects TO service_role
  USING (bucket_id = 'demand-documents')
  WITH CHECK (bucket_id = 'demand-documents');
