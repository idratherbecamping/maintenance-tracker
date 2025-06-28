-- Fix Storage Setup for Maintenance Tracker
-- Run this via the Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view company maintenance images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload maintenance images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own maintenance images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own maintenance images" ON storage.objects;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('vehicle-images', 'vehicle-images', true, 10485760, '{"image/*"}'),
  ('maintenance-images', 'maintenance-images', true, 10485760, '{"image/*"}')
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies for vehicle images
CREATE POLICY "Anyone can view vehicle images" ON storage.objects
FOR SELECT USING (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can upload vehicle images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'vehicle-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update vehicle images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'vehicle-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete vehicle images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'vehicle-images' 
    AND auth.role() = 'authenticated'
);

-- Storage policies for maintenance images  
CREATE POLICY "Anyone can view maintenance images" ON storage.objects
FOR SELECT USING (bucket_id = 'maintenance-images');

CREATE POLICY "Authenticated users can upload maintenance images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'maintenance-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update maintenance images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'maintenance-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete maintenance images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'maintenance-images' 
    AND auth.role() = 'authenticated'
);

SELECT 'Storage buckets and simplified policies created successfully!' as message;