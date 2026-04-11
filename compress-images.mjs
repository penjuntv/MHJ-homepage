#!/usr/bin/env node
/**
 * Supabase Storage 이미지 압축 스크립트
 *
 * 사용법:
 *   node compress-images.mjs              # 전체 images 버킷 처리
 *   node compress-images.mjs --dry-run    # 변경 없이 확인만
 *   node compress-images.mjs --folder=blogs  # 특정 폴더만 처리
 *   node compress-images.mjs --folder=gallery --dry-run
 */

import 'dotenv/config';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

// ── 설정 ──────────────────────────────────────────────
const BUCKET = 'images';
const MAX_WIDTH = 1920;           // 가로 최대 px
const JPEG_QUALITY = 80;          // JPEG 품질
const WEBP_QUALITY = 80;          // WebP 품질
const PNG_QUALITY = 80;           // PNG 품질 (0-100)
const MIN_SIZE_KB = 100;          // 이 크기 미만은 건너뜀
const SUPPORTED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

// ── CLI 인자 파싱 ─────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const folderArg = args.find(a => a.startsWith('--folder='));
const TARGET_FOLDER = folderArg ? folderArg.split('=')[1] : '';

// ── Supabase 클라이언트 ───────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: .env.local에 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ── 유틸 ──────────────────────────────────────────────
function getExt(name) {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i).toLowerCase();
}

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

// ── 폴더 내 파일 목록 (재귀) ──────────────────────────
async function listFiles(folder = '') {
  const all = [];
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    console.error(`  목록 조회 실패 (${folder || '/'}):`, error.message);
    return all;
  }

  for (const item of data) {
    const path = folder ? `${folder}/${item.name}` : item.name;
    if (item.id) {
      // 파일
      all.push({ path, metadata: item.metadata });
    } else {
      // 폴더 → 재귀
      const sub = await listFiles(path);
      all.push(...sub);
    }
  }
  return all;
}

// ── 이미지 압축 ──────────────────────────────────────
async function compressAndUpload(filePath) {
  const ext = getExt(filePath);
  if (!SUPPORTED_EXTS.includes(ext)) return null;

  // 다운로드
  const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(filePath);
  if (dlErr) {
    console.error(`  다운로드 실패: ${filePath}`, dlErr.message);
    return null;
  }

  const original = Buffer.from(await blob.arrayBuffer());
  const originalSize = original.length;

  if (originalSize < MIN_SIZE_KB * 1024) {
    return { path: filePath, skipped: true, reason: `< ${MIN_SIZE_KB}KB`, originalSize };
  }

  // sharp 파이프라인
  let pipeline = sharp(original).resize({ width: MAX_WIDTH, withoutEnlargement: true });

  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  } else if (ext === '.png') {
    pipeline = pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9 });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: WEBP_QUALITY });
  }

  const compressed = await pipeline.toBuffer();
  const newSize = compressed.length;
  const saved = originalSize - newSize;
  const pct = ((saved / originalSize) * 100).toFixed(1);

  if (saved <= 0) {
    return { path: filePath, skipped: true, reason: '이미 최적', originalSize };
  }

  if (!DRY_RUN) {
    const contentType =
      ext === '.png' ? 'image/png' :
      ext === '.webp' ? 'image/webp' :
      'image/jpeg';

    const { error: upErr } = await supabase.storage.from(BUCKET).update(filePath, compressed, {
      contentType,
      upsert: true,
    });
    if (upErr) {
      console.error(`  업로드 실패: ${filePath}`, upErr.message);
      return null;
    }
  }

  return { path: filePath, originalSize, newSize, saved, pct };
}

// ── 메인 ──────────────────────────────────────────────
async function main() {
  console.log('');
  console.log(`=== Supabase Storage 이미지 압축 ===`);
  console.log(`  버킷: ${BUCKET}`);
  console.log(`  폴더: ${TARGET_FOLDER || '(전체)'}`);
  console.log(`  모드: ${DRY_RUN ? '🔍 DRY-RUN (변경 없음)' : '🔧 실제 압축'}`);
  console.log(`  설정: max ${MAX_WIDTH}px, JPEG ${JPEG_QUALITY}%, WebP ${WEBP_QUALITY}%, PNG ${PNG_QUALITY}%`);
  console.log('');

  const files = await listFiles(TARGET_FOLDER);
  const imageFiles = files.filter(f => SUPPORTED_EXTS.includes(getExt(f.path)));

  console.log(`  이미지 파일 ${imageFiles.length}개 발견 (전체 ${files.length}개 중)`);
  console.log('');

  let totalSaved = 0;
  let compressed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const progress = `[${i + 1}/${imageFiles.length}]`;

    try {
      const result = await compressAndUpload(file.path);

      if (!result) {
        failed++;
        continue;
      }

      if (result.skipped) {
        skipped++;
        console.log(`  ${progress} SKIP  ${file.path}  (${result.reason}, ${fmtSize(result.originalSize)})`);
      } else {
        compressed++;
        totalSaved += result.saved;
        console.log(`  ${progress} ${DRY_RUN ? 'WOULD' : 'OK'}    ${file.path}  ${fmtSize(result.originalSize)} → ${fmtSize(result.newSize)}  (-${result.pct}%)`);
      }
    } catch (err) {
      failed++;
      console.error(`  ${progress} ERROR ${file.path}:`, err.message);
    }
  }

  console.log('');
  console.log(`=== 완료 ===`);
  console.log(`  압축: ${compressed}개  |  건너뜀: ${skipped}개  |  실패: ${failed}개`);
  console.log(`  절약: ${fmtSize(totalSaved)}`);
  if (DRY_RUN) console.log(`  (DRY-RUN — 실제 변경 없음)`);
  console.log('');
}

main().catch(err => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
