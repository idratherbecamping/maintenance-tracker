import { createClient } from '@/lib/supabase/client';

// Image compression utility
export const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          resolve(blob as Blob);
        },
        'image/jpeg',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

// Upload image to Supabase Storage
export const uploadImage = async (
  file: File,
  bucket: 'vehicle-images' | 'maintenance-images',
  path: string,
  compress: boolean = true
): Promise<string> => {
  const supabase = createClient();

  try {
    let fileToUpload: File | Blob = file;

    // Compress image if requested and it's an image
    if (compress && file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    return data.path;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from Supabase Storage
export const deleteImage = async (
  bucket: 'vehicle-images' | 'maintenance-images',
  path: string
): Promise<void> => {
  const supabase = createClient();

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Get public URL for image
export const getImageUrl = (
  bucket: 'vehicle-images' | 'maintenance-images',
  path: string | null
): string | null => {
  if (!path) return null;

  const supabase = createClient();
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

// Generate unique file path
export const generateImagePath = (userId: string, fileName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2);
  const extension = fileName.split('.').pop();
  
  return `${userId}/${timestamp}-${randomString}.${extension}`;
};

// Validate image file
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 10MB' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Supported formats: JPEG, PNG, WebP' };
  }

  return { valid: true };
};