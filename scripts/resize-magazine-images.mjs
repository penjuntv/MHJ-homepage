#!/usr/bin/env node
/**
 * Resize oversized magazine article images in Supabase Storage in-place.
 *
 * Why: 4000+×4000 px article images blow up Chromium's raw bitmap memory
 *      (~160MB+) inside the puppeteer capture lambda, causing CDP
 *      Page.captureScreenshot to fail. Cap to 1600px max dim — same path,
 *      same URL, no DB writes needed.
 *
 * Usage: node scripts/resize-magazine-images.mjs [--dry-run]
 *
 * Safety:
 *  - Backs up every original to /tmp/mhj-image-backups/<filename> first.
 *  - Stops on the first failure (no partial state).
 *  - Skips images already <= 1600px in either dimension.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

// ── env ──
function loadEnv(path) {
  if (!existsSync(path)) throw new Error(`env file missing: ${path}`);
  const text = readFileSync(path, 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return env;
}
const env = loadEnv('.env.local');
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── config ──
const BUCKET = 'images';
const STORAGE_PREFIX = 'articles';
const MAX_DIM = 1600;
const JPEG_QUALITY = 85;
const BACKUP_DIR = '/tmp/mhj-image-backups';

const FILES = [
  '1777166098378_slot2.jpeg',
  '1777001034002_slot4.jpeg',
  '1777000973805_slot2.jpeg',
  '1777002492476_slot5.jpeg',
  '1777002571622_slot8.jpeg',
  '1777166028084_slot0.jpeg',
  '1777001012681_slot3.jpeg',
  '1777165755091_slot4.jpeg',
  '1777002524268_slot6.jpeg',
  '1777000933268_slot1.jpeg',
  '1777165699910_slot1.jpeg',
  '1777002550767_slot7.jpeg',
  '1777158035235_slot0.png',
  '1777000816977_slot0.jpeg',
  '1777165690382_slot0.jpeg',
  '1777165762821_slot5.jpeg',
  '1777165740591_slot3.jpeg',
  '1777165792858_slot6.jpeg',
  '1777165770807_slot8.jpeg',
  '1777165717692_slot2.jpeg',
];

// ── helpers ──
const fmtKb = (b) => `${(b / 1024).toFixed(1)}KB`;
const fmtMb = (b) => `${(b / 1024 / 1024).toFixed(2)}MB`;

async function downloadOnce(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`download failed: ${error?.message ?? 'no body'}`);
  return Buffer.from(await data.arrayBuffer());
}

async function uploadInPlace(path, buf, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new Error(`upload failed: ${error.message}`);
}

// ── main ──
mkdirSync(BACKUP_DIR, { recursive: true });
console.log(`Bucket: ${BUCKET}, prefix: ${STORAGE_PREFIX}/, max ${MAX_DIM}px`);
console.log(`Backups: ${BACKUP_DIR}`);
if (DRY_RUN) console.log('DRY RUN — no uploads will happen');

const results = [];
for (let i = 0; i < FILES.length; i++) {
  const filename = FILES[i];
  const path = `${STORAGE_PREFIX}/${filename}`;
  const ext = filename.toLowerCase().split('.').pop();
  const isPng = ext === 'png';
  const idx = `[${String(i + 1).padStart(2)}/${FILES.length}]`;
  process.stdout.write(`\n${idx} ${path}\n`);

  try {
    const original = await downloadOnce(path);
    const backupPath = join(BACKUP_DIR, filename);
    writeFileSync(backupPath, original);
    const meta = await sharp(original).metadata();
    console.log(`   original: ${meta.width}×${meta.height} ${meta.format} ${fmtKb(original.length)}`);

    if ((meta.width ?? 0) <= MAX_DIM && (meta.height ?? 0) <= MAX_DIM) {
      console.log('   already ≤ 1600px → skipped');
      results.push({ filename, status: 'skipped' });
      continue;
    }

    let pipeline = sharp(original).resize({
      width: MAX_DIM,
      height: MAX_DIM,
      fit: 'inside',
      withoutEnlargement: true,
    });
    let contentType;
    if (isPng) {
      pipeline = pipeline.png({ compressionLevel: 9 });
      contentType = 'image/png';
    } else {
      pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true });
      contentType = 'image/jpeg';
    }
    const resized = await pipeline.toBuffer();
    const newMeta = await sharp(resized).metadata();
    console.log(`   resized:  ${newMeta.width}×${newMeta.height} ${fmtKb(resized.length)}`);

    if (DRY_RUN) {
      results.push({ filename, status: 'dry-run' });
      continue;
    }

    await uploadInPlace(path, resized, contentType);
    console.log('   uploaded ✓');
    results.push({ filename, status: 'resized', from: original.length, to: resized.length });
  } catch (e) {
    console.error(`✗ FAILED on ${filename}:`, e.message);
    console.error(`Backups so far: ${BACKUP_DIR}`);
    process.exit(1);
  }
}

// ── verify ──
if (!DRY_RUN) {
  console.log('\n── verify ──');
  let okCount = 0;
  for (const r of results) {
    if (r.status === 'skipped' || r.status === 'dry-run') {
      okCount++;
      continue;
    }
    const path = `${STORAGE_PREFIX}/${r.filename}`;
    const buf = await downloadOnce(path);
    const meta = await sharp(buf).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const sizeMb = buf.length / 1024 / 1024;
    const dimOk = w <= MAX_DIM && h <= MAX_DIM;
    const sizeOk = sizeMb <= 1.0;
    const flag = dimOk && sizeOk ? '✓' : '!';
    console.log(`   ${flag} ${r.filename}: ${w}×${h} ${fmtMb(buf.length)}${sizeOk ? '' : ' (>1MB)'}`);
    if (dimOk) okCount++;
  }
  console.log(`\nVerified: ${okCount}/${results.length} dim-OK`);
}

const tally = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc), {});
console.log('\nSummary:', tally);
console.log(`Backups: ${BACKUP_DIR}`);
