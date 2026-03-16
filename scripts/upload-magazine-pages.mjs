import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SUPABASE_URL = 'https://asatbuonduelfrhdkwgu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzYXRidW9uZHVlbGZyaGRrd2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MjAxNTIsImV4cCI6MjA4NzE5NjE1Mn0.-hA4aYkIToqC3bOxmU0W2dWL03NZe1FP1aqZWG53kMg';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const MAGAZINES = [
  { id: '2025-12', folder: '2025-12' },
  { id: '2026-01', folder: '2026-01' },
];

async function uploadPages() {
  for (const mag of MAGAZINES) {
    const dir = join(ROOT, 'magazine-pages', mag.folder);
    const files = readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();

    console.log(`\nUploading ${mag.id}: ${files.length} files`);

    for (const file of files) {
      const localPath = join(dir, file);
      const storagePath = `magazines/${mag.id}/pages/${file}`;
      const fileData = readFileSync(localPath);

      const { error } = await supabase.storage
        .from('images')
        .upload(storagePath, fileData, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error(`  ✗ ${file}: ${error.message}`);
      } else {
        console.log(`  ✓ ${file}`);
      }
    }
  }
  console.log('\nUpload complete.');
}

uploadPages().catch(console.error);
