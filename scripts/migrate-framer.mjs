/**
 * migrate-framer.mjs
 * 1. framerusercontent.com 이미지 → Supabase Storage 이전
 * 2. plain text content → TipTap HTML 변환
 *
 * 실행: node scripts/migrate-framer.mjs
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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ SUPABASE_URL 또는 SERVICE_ROLE_KEY 누락');
  process.exit(1);
}

// ─── Supabase REST 헬퍼 ──────────────────────────────────────────────────────
async function dbSelect(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`dbSelect ${res.status}: ${await res.text()}`);
  return res.json();
}

async function dbUpdate(table, id, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
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

async function storageUpload(bucket, path_, buffer, contentType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path_}`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`storageUpload ${res.status}: ${text}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path_}`;
}

// ─── 유틸: plain text → TipTap HTML ────────────────────────────────────────
function plainToHtml(text) {
  if (!text || text.includes('<p>')) return text;

  const lines = text.split('\n');
  const paragraphs = [];
  let currentLines = [];

  for (const line of lines) {
    if (line.trim() === '') {
      if (currentLines.length > 0) {
        paragraphs.push([...currentLines]);
        currentLines = [];
      }
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) paragraphs.push(currentLines);

  const html = paragraphs.map(group => {
    // 인용문만 있는 단락
    if (group.length === 1 && group[0].startsWith('> ')) {
      return `<blockquote><p>${group[0].slice(2).trim()}</p></blockquote>`;
    }

    // 일반 단락 처리 (단독 \n → <br>)
    const inner = group.map((line, i) => {
      if (line.startsWith('> ')) {
        return (i > 0 ? '' : '') + `</p><blockquote><p>${line.slice(2).trim()}</p></blockquote><p>`;
      }
      return i === 0 ? line : `<br>${line}`;
    }).join('');

    const wrapped = `<p>${inner}</p>`;
    // 빈 <p></p> 제거
    return wrapped.replace(/<p><\/p>/g, '').replace(/<p><br><\/p>/g, '');
  }).join('');

  return html;
}

// ─── 유틸: URL에서 확장자 추출 ───────────────────────────────────────────────
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

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 마이그레이션 시작\n');

  const blogs = await dbSelect('blogs', 'select=id,title,image_url,og_image_url,content&order=id');
  console.log(`📚 총 ${blogs.length}개 글\n`);

  const log = { imageSuccess: [], imageFail: [], textConverted: [], textSkipped: [] };

  for (const blog of blogs) {
    const isFramerImage = blog.image_url?.includes('framerusercontent.com');
    const isFramerOg = blog.og_image_url?.includes('framerusercontent.com');
    const isPlainText = blog.content && !blog.content.includes('<p>');
    const hasFramerInContent = blog.content?.includes('framerusercontent.com');

    let updatePayload = {};

    // ── 커버 이미지 이전 ──────────────────────────────────────────────────
    if (isFramerImage) {
      process.stdout.write(`[${blog.id}] ${blog.title}\n  └ 커버 이미지 이전... `);
      try {
        const ext = getExtFromUrl(blog.image_url);
        const storagePath = `blog/blog-${blog.id}-cover.${ext}`;

        const res = await fetch(blog.image_url, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const contentType = res.headers.get('content-type') || `image/${ext}`;
        const buffer = await res.arrayBuffer();

        const publicUrl = await storageUpload('images', storagePath, buffer, contentType);
        updatePayload.image_url = publicUrl;

        if (isFramerOg) updatePayload.og_image_url = publicUrl;

        console.log('✅');
        log.imageSuccess.push(blog.id);
      } catch (e) {
        console.log(`⚠️ 실패 (원본 유지): ${e.message}`);
        log.imageFail.push({ id: blog.id, title: blog.title, error: e.message });
      }
    }

    // ── content 내 framer 인라인 이미지 교체 ────────────────────────────
    if (hasFramerInContent) {
      process.stdout.write(`  └ content 내 framer URL 교체... `);
      try {
        let newContent = blog.content;
        const framerUrls = [...new Set(
          (blog.content.match(/https:\/\/framerusercontent\.com\/[^\s"')<]+/g) || [])
        )];
        let replaced = 0;
        for (const framerUrl of framerUrls) {
          const ext = getExtFromUrl(framerUrl);
          const storagePath = `blog/blog-${blog.id}-inline-${replaced}.${ext}`;
          try {
            const res = await fetch(framerUrl, { signal: AbortSignal.timeout(20000) });
            if (!res.ok) continue;
            const contentType = res.headers.get('content-type') || `image/${ext}`;
            const buf = await res.arrayBuffer();
            const publicUrl = await storageUpload('images', storagePath, buf, contentType);
            newContent = newContent.replaceAll(framerUrl, publicUrl);
            replaced++;
          } catch {}
        }
        updatePayload.content = newContent;
        blog.content = newContent;
        console.log(`✅ (${replaced}개 교체)`);
      } catch (e) {
        console.log(`⚠️ 실패: ${e.message}`);
      }
    }

    // ── plain text → TipTap HTML 변환 ────────────────────────────────────
    if (isPlainText) {
      const converted = plainToHtml(blog.content);
      updatePayload.content_backup = blog.content;
      updatePayload.content = converted;
      log.textConverted.push(blog.id);
      console.log(`  └ 텍스트 → HTML 변환 ✅`);
    } else if (!isFramerImage && !hasFramerInContent) {
      log.textSkipped.push(blog.id);
    }

    // ── DB 업데이트 ──────────────────────────────────────────────────────
    if (Object.keys(updatePayload).length > 0) {
      try {
        await dbUpdate('blogs', blog.id, updatePayload);
      } catch (e) {
        console.error(`  └ ❌ DB 업데이트 실패: ${e.message}`);
      }
    }
  }

  // ── 결과 리포트 ──────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log('📊 마이그레이션 완료 리포트');
  console.log('══════════════════════════════════════');
  console.log(`✅ 이미지 이전 성공: ${log.imageSuccess.length}개 (IDs: ${log.imageSuccess.join(', ')})`);
  if (log.imageFail.length > 0) {
    console.log(`⚠️  이미지 이전 실패: ${log.imageFail.length}개`);
    log.imageFail.forEach(f => console.log(`   - [${f.id}] ${f.title}: ${f.error}`));
  }
  console.log(`📝 텍스트 변환: ${log.textConverted.length}개 (IDs: ${log.textConverted.join(', ')})`);
  console.log(`⏭️  스킵 (이미 HTML): ${log.textSkipped.length}개`);

  // ── 검증 ──────────────────────────────────────────────────────────────
  console.log('\n🔍 검증 중...');
  const remainFramer = await dbSelect('blogs', 'select=id,title&image_url=like.*framerusercontent*');
  console.log(`framer image_url 남은 글: ${remainFramer.length}개 ${remainFramer.length === 0 ? '✅' : '⚠️'}`);
  if (remainFramer.length > 0) remainFramer.forEach(b => console.log(`  - [${b.id}] ${b.title}`));

  const remainPlain = await dbSelect('blogs', 'select=id,title&published=eq.true&content=not.like.*%3Cp%3E*');
  console.log(`plain text 남은 글: ${remainPlain.length}개 ${remainPlain.length === 0 ? '✅' : '⚠️'}`);

  // 로그 저장
  mkdirSync(path.join(__dirname, 'output'), { recursive: true });
  const logPath = path.join(__dirname, 'output', `migrate-framer-${Date.now()}.json`);
  writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.log(`\n📁 로그: ${logPath}`);
}

main().catch(e => {
  console.error('❌ 치명 오류:', e);
  process.exit(1);
});
