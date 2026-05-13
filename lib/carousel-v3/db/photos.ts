import { createAdminClient } from '@/lib/supabase';

const BUCKET = 'carousel-v3-photos';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function uploadPhoto(file: File): Promise<string> {
  const ext = MIME_TO_EXT[file.type];
  if (!ext) throw new Error(`Unsupported MIME: ${file.type}`);

  const admin = createAdminClient();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`photo upload: ${uploadError.message}`);

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
