/**
 * gen-body-sql.mjs
 * 1. DB에서 markdown content 읽기
 * 2. plainToHtml() 변환 (> caption → <blockquote>)
 * 3. blockquote → <figure> (이미 업로드된 이미지 URL 사용)
 * 4. SQL UPDATE 구문 출력 → Supabase MCP로 실행
 *
 * 실행: node scripts/gen-body-sql.mjs
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
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = 'https://asatbuonduelfrhdkwgu.supabase.co/storage/v1/object/public/images/blog';

const BLOG_IDS = [13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,32,33];

// ─── migrate-framer.mjs의 plainToHtml 함수 ────────────────────────────────────
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
    if (group.length === 1 && group[0].startsWith('> ')) {
      return `<blockquote><p>${group[0].slice(2).trim()}</p></blockquote>`;
    }
    const inner = group.map((line, i) => {
      if (line.startsWith('> ')) {
        return (i > 0 ? '' : '') + `</p><blockquote><p>${line.slice(2).trim()}</p></blockquote><p>`;
      }
      return i === 0 ? line : `<br>${line}`;
    }).join('');
    const wrapped = `<p>${inner}</p>`;
    return wrapped.replace(/<p><\/p>/g, '').replace(/<p><br><\/p>/g, '');
  }).join('');

  return html;
}

// ─── blockquote를 순서대로 figure로 교체 ────────────────────────────────────────
function replaceBlockquotesWithFigures(html, blogId) {
  let nn = 1;
  // <blockquote><p>CAPTION</p></blockquote> 패턴 (greedy 없이 단순 split 방식)
  // HTML에서 blockquote는 중첩되지 않으므로 split/join으로 처리
  const parts = html.split('<blockquote>');
  const result = [parts[0]];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    // </blockquote> 위치 찾기
    const closeIdx = part.indexOf('</blockquote>');
    if (closeIdx === -1) {
      // 닫는 태그 없으면 그대로 유지
      result.push('<blockquote>' + part);
      continue;
    }

    const inner = part.slice(0, closeIdx); // <p>caption</p>
    const after = part.slice(closeIdx + '</blockquote>'.length);

    // <p>caption</p> 에서 caption 추출
    const pMatch = inner.match(/^<p>([\s\S]*?)<\/p>$/);
    if (!pMatch) {
      // p 태그 구조가 아니면 유지 (진짜 인용문)
      result.push('<blockquote>' + part);
      continue;
    }

    const caption = pMatch[1];
    const imgUrl = `${BASE_URL}/blog-${blogId}-body-${String(nn).padStart(2, '0')}.webp`;
    const safeAlt = caption.replace(/"/g, '&quot;');

    result.push(
      `<figure class="blog-body-image">\n` +
      `  <img src="${imgUrl}" alt="${safeAlt}" loading="lazy" />\n` +
      `  <figcaption>${caption}</figcaption>\n` +
      `</figure>` +
      after
    );
    nn++;
  }

  return result.join('');
}

// ─── SQL 이스케이프 ──────────────────────────────────────────────────────────
function sqlEscape(str) {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

async function main() {
  console.log('📖 DB에서 content 읽는 중...\n');

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/blogs?id=in.(${BLOG_IDS.join(',')})&select=id,slug,content&order=id`,
    { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}`, 'Accept': 'application/json' } }
  );
  if (!res.ok) throw new Error(`fetch ${res.status}: ${await res.text()}`);
  const blogs = await res.json();

  const sqlStatements = [];
  const preview = [];

  for (const blog of blogs) {
    const content = blog.content || '';
    const isMarkdown = !content.includes('<p>');

    // 1. markdown이면 HTML 변환
    let html = isMarkdown ? plainToHtml(content) : content;

    // 2. blockquote → figure 교체
    const bqCountBefore = (html.match(/<blockquote>/g) || []).length;
    html = replaceBlockquotesWithFigures(html, blog.id);
    const bqCountAfter = (html.match(/<blockquote>/g) || []).length;
    const figCount = (html.match(/<figure class="blog-body-image">/g) || []).length;

    preview.push({
      id: blog.id, slug: blog.slug,
      wasMarkdown: isMarkdown,
      bqBefore: bqCountBefore, bqAfter: bqCountAfter, figures: figCount
    });

    // 3. DB PATCH
    process.stdout.write(`  → DB 업데이트 중... `);
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/blogs?id=eq.${blog.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ content: html }),
    });
    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.log(`❌ ${patchRes.status}: ${errText}`);
    } else {
      console.log(`✅`);
    }

    sqlStatements.push(`-- [${blog.id}] ${blog.slug}: bq${bqCountBefore}→figure${figCount}`);
    console.log(`[${blog.id}] ${blog.slug}`);
    console.log(`  ${isMarkdown ? 'markdown→HTML' : 'HTML 그대로'} | bq: ${bqCountBefore}→${bqCountAfter} | figure: ${figCount}`);
  }

  mkdirSync(path.join(__dirname, 'output'), { recursive: true });
  writeFileSync(path.join(__dirname, 'output', 'body-image-preview.json'), JSON.stringify(preview, null, 2));
}

main().catch(e => {
  console.error('❌ 오류:', e);
  process.exit(1);
});
