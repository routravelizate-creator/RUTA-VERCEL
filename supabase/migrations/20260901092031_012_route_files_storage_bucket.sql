/*
# Create storage bucket for route files (GPX uploads)
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('route-files', 'route-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "route_files_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'route-files');

-- Allow public read
CREATE POLICY "route_files_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'route-files');

-- Allow users to delete their own files
CREATE POLICY "route_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'route-files' AND owner = auth.uid());
