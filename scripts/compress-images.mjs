#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const content = readFileSync(join(__dirname, '../.env.local'), 'utf-8');
for (const line of content.split('\n')) {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '');
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY_RUN = process.argv.includes('--dry-run');
const FOLDER = process.argv.find(a => a.startsWith('--folder='))?.split('=')[1] || null;
const FOLDERS = ['blogs', 'magazines', 'articles', 'newsletters', 'site', 'family'];
const SKIP = new Set(['pdf','heic','heif','gif','svg']);
const OK = new Set(['jpg','jpeg','png','webp']);
let totalSaved = 0, done = 0, skipped = 0, errors = 0;

async function processFolder(folder) {
  let offset = 0;
  while (true) {
    const { data: files, error } = await supabase.storage.from('images').list(folder, { limit: 50, offset });
    if (error || !files?.length) break;
    for (const f of files) {
      if (!f.metadata?.size) continue;
      const kb = f.metadata.size / 1024;
      const path = `${folder}/${f.name}`;
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (SKIP.has(ext) || !OK.has(ext) || kb < 300) { skipped++; continue; }
      if (DRY_RUN) { console.log(`[DRY] ${path} (${Math.round(kb)}KB)`); done++; continue; }
      try {
        const { data: blob } = await supabase.storage.from('images').download(path);
        if (!blob) { errors++; continue; }
        const buf = Buffer.from(await blob.arrayBuffer());
        const comp = await sharp(buf).resize(1600,1600,{fit:'inside',withoutEnlargement:true}).jpeg({quality:78,progressive:true}).toBuffer();
        const saving = ((buf.length - comp.length) / buf.length) * 100;
        if (saving < 25) { skipped++; continue; }
        const { error: upErr } = await supabase.storage.from('images').upload(path, comp, { contentType:'image/jpeg', upsert:true });
        if (upErr) { console.error(`❌ ${path}: ${upErr.message}`); errors++; continue; }
        const savedKB = Math.round((buf.length - comp.length) / 1024);
        totalSaved += savedKB;
        console.log(`✅ ${path}: ${Math.round(kb)}KB → ${Math.round(comp.length/1024)}KB (${Math.round(saving)}% 절감)`);
        done++;
      } catch(e) { console.error(`❌ ${path}: ${e.message}`); errors++; }
    }
    if (files.length < 50) break;
    offset += 50;
  }
}

console.log(`\n🗜️ MHJ 이미지 압축 | 모드: ${DRY_RUN ? 'DRY RUN' : '실제 압축'}\n`);
for (const f of FOLDER ? [FOLDER] : FOLDERS) await processFolder(f);
console.log(`\n📊 완료: ${done}개 | 스킵: ${skipped}개 | 오류: ${errors}개 | 절감: ${(totalSaved/1024).toFixed(1)}MB`);
