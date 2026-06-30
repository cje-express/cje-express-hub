-- Create avatars storage bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY IF NOT EXISTS "Public read avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Authenticated users can upload/update their own avatar
CREATE POLICY IF NOT EXISTS "Users upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Users update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Service role can manage everything
CREATE POLICY IF NOT EXISTS "Service role full access avatars"
  ON storage.objects
  TO service_role
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');
