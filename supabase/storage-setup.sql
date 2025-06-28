-- Supabase Storage Setup for Maintenance Tracker
-- Run this via the Supabase SQL Editor to set up storage buckets and policies

-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for maintenance images
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance-images', 'maintenance-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vehicle images
-- Allow authenticated users to view all vehicle images
CREATE POLICY "Anyone can view vehicle images" ON storage.objects
FOR SELECT USING (bucket_id = 'vehicle-images');

-- Allow authenticated users to upload vehicle images
CREATE POLICY "Authenticated users can upload vehicle images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'vehicle-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')::text
);

-- Allow users to update their own vehicle images
CREATE POLICY "Users can update own vehicle images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'vehicle-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')::text
) WITH CHECK (
    bucket_id = 'vehicle-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')::text
);

-- Allow users to delete their own vehicle images
CREATE POLICY "Users can delete own vehicle images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'vehicle-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')::text
);

-- Storage policies for maintenance images
-- Allow authenticated users to view maintenance images from their company
CREATE POLICY "Users can view company maintenance images" ON storage.objects
FOR SELECT USING (
    bucket_id = 'maintenance-images'
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to upload maintenance images
CREATE POLICY "Authenticated users can upload maintenance images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'maintenance-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')::text
);

-- Allow users to update their own maintenance images
CREATE POLICY "Users can update own maintenance images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'maintenance-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')::text
) WITH CHECK (
    bucket_id = 'maintenance-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')::text
);

-- Allow users to delete their own maintenance images
CREATE POLICY "Users can delete own maintenance images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'maintenance-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')::text
);

-- Helper function to get public URL for images
CREATE OR REPLACE FUNCTION get_vehicle_image_url(image_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT 
            CASE 
                WHEN image_path IS NOT NULL THEN
                    current_setting('app.supabase_url') || '/storage/v1/object/public/vehicle-images/' || image_path
                ELSE NULL 
            END
    );
END;
$$;

CREATE OR REPLACE FUNCTION get_maintenance_image_url(image_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT 
            CASE 
                WHEN image_path IS NOT NULL THEN
                    current_setting('app.supabase_url') || '/storage/v1/object/public/maintenance-images/' || image_path
                ELSE NULL 
            END
    );
END;
$$;

SELECT 'Storage buckets and policies created successfully!' as message;