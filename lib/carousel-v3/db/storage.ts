import { createAdminClient } from '@/lib/supabase';

const BUCKET = 'carousel-v3-output';
const SIGNED_URL_TTL = 30 * 24 * 60 * 60; // 30 days

export async function uploadZip(jobId: string, zipBuffer: Buffer): Promise<string> {
  const admin = createAdminClient();
  const path = `jobs/${jobId}/output.zip`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, zipBuffer, { contentType: 'application/zip', upsert: true });
  if (uploadError) throw new Error(`ZIP upload: ${uploadError.message}`);

  const { data, error: urlError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (urlError || !data) throw new Error(`signed URL: ${urlError?.message}`);

  return data.signedUrl;
}
