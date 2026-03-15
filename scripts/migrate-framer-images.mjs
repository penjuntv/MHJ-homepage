/**
 * migrate-framer-images.mjs
 * framerusercontent.com 이미지 → Supabase Storage 이전
 *
 * 실행: node scripts/migrate-framer-images.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env.local 파싱
const envPath = path.join(__dirname, '..', '.env.local');
const envRaw = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;  // JWT 형식 — REST API 사용 가능

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ SUPABASE_URL 또는 ANON_KEY 누락');
  process.exit(1);
}

// ─── Supabase REST 헬퍼 (anon JWT) ──────────────────────────────────────────
const BASE_HEADERS = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Accept': 'application/json',
};

async function dbSelect(query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blogs?${query}`, {
    headers: BASE_HEADERS,
  });
  if (!res.ok) throw new Error(`dbSelect ${res.status}: ${await res.text()}`);
  return res.json();
}

async function dbUpdate(id, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blogs?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dbUpdate ${res.status}: ${text}`);
  }
}

async function storageUpload(storagePath, buffer, contentType) {
  // Supabase Storage API — anon key Bearer (버킷 public insert 정책 필요)
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/images/${storagePath}`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`storageUpload ${res.status}: ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;
}

function getExtFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split('/').pop() || '';
    if (last.includes('.')) {
      const ext = last.split('.').pop().toLowerCase().split('?')[0];
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) return ext;
    }
  } catch {}
  return 'jpg';
}

async function main() {
  console.log('🖼️  이미지 이전 시작\n');

  // framer 이미지가 있는 글만 조회
  const blogs = await dbSelect(
    'select=id,title,image_url,og_image_url&image_url=like.*framerusercontent*&order=id'
  );

  console.log(`📸 이전 대상: ${blogs.length}개\n`);

  const success = [];
  const fail = [];

  for (const blog of blogs) {
    process.stdout.write(`[${blog.id}] ${blog.title}\n  └ `);
    try {
      const ext = getExtFromUrl(blog.image_url);
      const storagePath = `blog/blog-${blog.id}-cover.${ext}`;

      // 다운로드
      const imgRes = await fetch(blog.image_url, { signal: AbortSignal.timeout(30000) });
      if (!imgRes.ok) throw new Error(`이미지 다운로드 실패 (HTTP ${imgRes.status})`);
      const contentType = imgRes.headers.get('content-type') || `image/${ext}`;
      const buffer = await imgRes.arrayBuffer();

      // Storage 업로드
      const publicUrl = await storageUpload(storagePath, buffer, contentType);

      // DB 업데이트
      const payload = { image_url: publicUrl };
      if (blog.og_image_url?.includes('framerusercontent.com')) {
        payload.og_image_url = publicUrl;
      }
      await dbUpdate(blog.id, payload);

      console.log(`✅ → ${publicUrl}`);
      success.push(blog.id);
    } catch (e) {
      console.log(`⚠️  실패 (원본 유지): ${e.message}`);
      fail.push({ id: blog.id, title: blog.title, error: e.message });
    }
  }

  // ── 리포트 ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log('📊 이미지 이전 완료');
  console.log('══════════════════════════════════════');
  console.log(`✅ 성공: ${success.length}개 (IDs: ${success.join(', ')})`);
  if (fail.length > 0) {
    console.log(`⚠️  실패: ${fail.length}개`);
    fail.forEach(f => console.log(`   - [${f.id}] ${f.title}: ${f.error}`));
  }

  // 검증
  console.log('\n🔍 검증...');
  const remaining = await dbSelect('select=id,title&image_url=like.*framerusercontent*');
  console.log(`framer URL 남은 글: ${remaining.length}개 ${remaining.length === 0 ? '✅' : '⚠️'}`);
  if (remaining.length > 0) remaining.forEach(b => console.log(`  - [${b.id}] ${b.title}`));

  // 로그 저장
  mkdirSync(path.join(__dirname, 'output'), { recursive: true });
  const logPath = path.join(__dirname, 'output', `image-migrate-${Date.now()}.json`);
  writeFileSync(logPath, JSON.stringify({ success, fail }, null, 2));
  console.log(`\n📁 로그: ${logPath}`);
}

main().catch(e => {
  console.error('❌ 치명 오류:', e);
  process.exit(1);
});
