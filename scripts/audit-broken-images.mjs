#!/usr/bin/env node
/**
 * 깨진 이미지 전수 감사 — DB 안의 모든 이미지 URL 이 실제로 살아 있는지 확인한다.
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-broken-images.mjs
 *   node --env-file=.env.local scripts/audit-broken-images.mjs --json   # 기계 판독용
 *
 * Exit code: 깨진 URL 이 하나라도 있으면 1.
 *
 * 왜 필요한가:
 *   본문 HTML 안의 <img> 는 어디에서도 검증되지 않는다. 파일이 스토리지에서 사라져도
 *   글은 그대로 발행돼 있고, 독자에게만 깨진 이미지로 보인다. 2026-09 점검에서
 *   blog #27 "Byebye Mommy" 의 blog-27-body-04.webp 가 그 상태였다
 *   (스토리지에는 body-01/02/03 만 있고 04 는 아예 없음).
 *
 * 검사 범위: blogs(content·image_url) · articles(content·image_url·article_images)
 *            article_pages(content·images) · magazines(image_url·cover_images) · gallery
 */
import { createClient } from '@supabase/supabase-js';

const JSON_OUT = process.argv.includes('--json');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요하다.');
  console.error('실행: node --env-file=.env.local scripts/audit-broken-images.mjs');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const URL_RE = /https?:\/\/[^\s"'<>()\\]+/g;
const looksLikeImage = (u) =>
  /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u) || u.includes('/storage/v1/object/public/');

/** 각 레코드의 텍스트/배열 필드에서 이미지 URL 을 긁어모은다. */
const refs = [];
function collect(where, id, label, ...fields) {
  for (const f of fields) {
    for (const raw of String(f ?? '').match(URL_RE) ?? []) {
      const u = raw.replace(/[.,)\]]+$/, '');           // 문장부호가 붙어 오는 경우 정리
      if (looksLikeImage(u)) refs.push({ where, id, label, url: u });
    }
  }
}

/* ⚠ 없는 컬럼을 하나라도 select 하면 그 쿼리 전체가 에러가 되고 data 는 null 이 된다.
   `data ?? []` 로 넘기면 그 테이블이 통째로 감사에서 빠지는데 겉보기엔 정상 종료한다.
   실제로 초판에서 blogs 에 존재하지 않는 og_image 를 넣는 바람에 **블로그 83편 전체가
   조용히 누락**됐고, 그래서 blog #27 의 깨진 이미지를 놓쳤다. 에러는 반드시 세운다. */
async function must(table, columns) {
  const { data, error } = await db.from(table).select(columns);
  if (error) throw new Error(`${table} 조회 실패 — ${error.message}`);
  return data ?? [];
}

const [blogs, arts, pages, mags, gal] = await Promise.all([
  must('blogs', 'id,slug,content,image_url'),
  must('articles', 'id,magazine_id,title,content,image_url,article_images'),
  must('article_pages', 'id,article_id,content,images'),
  must('magazines', 'id,title,image_url,cover_images'),
  must('gallery', 'id,caption,image_url'),
]);

for (const b of blogs) collect('blog', b.id, `/blog/${b.slug}`, b.content, b.image_url);
for (const a of arts) collect('article', a.id, `${a.magazine_id} · ${a.title}`, a.content, a.image_url, ...(a.article_images ?? []));
for (const p of pages) collect('article_page', p.id, `article ${p.article_id}`, p.content, ...(p.images ?? []));
for (const m of mags) collect('magazine', m.id, m.title, m.image_url, ...(m.cover_images ?? []));
for (const g of gal) collect('gallery', g.id, g.caption ?? '', g.image_url);

const unique = [...new Set(refs.map((r) => r.url))];
if (!JSON_OUT) console.log(`이미지 참조 ${refs.length}건 · 고유 URL ${unique.length}건 — 확인 중…`);

/** HEAD 로 확인하고, HEAD 를 막는 서버를 위해 실패 시 GET(Range)로 한 번 더 본다. */
async function check(u, attempt = 0) {
  try {
    const head = await fetch(u, { method: 'HEAD' });
    if (head.ok) return null;
    // HEAD 를 막는 서버가 있어 GET(Range)로 한 번 더 본다.
    const get = await fetch(u, { headers: { Range: 'bytes=0-0' } });
    return get.ok ? null : get.status;
  } catch (e) {
    // 일시적 네트워크 오류를 "깨짐"으로 보고하면 오탐이 된다(실제로 정상인 1.5MB
    // 표지가 그렇게 잡혔다). 두 번까지 재시도한 뒤에만 실패로 확정한다.
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      return check(u, attempt + 1);
    }
    return `ERR ${e.message.slice(0, 30)}`;
  }
}

const broken = [];
const CONC = 12;
for (let i = 0; i < unique.length; i += CONC) {
  const slice = unique.slice(i, i + CONC);
  const results = await Promise.all(slice.map(check));
  slice.forEach((u, k) => { if (results[k] !== null) broken.push({ url: u, status: results[k] }); });
  if (!JSON_OUT) process.stdout.write(`\r  ${Math.min(i + CONC, unique.length)}/${unique.length}`);
}
if (!JSON_OUT) console.log('');

const report = broken.map((b) => ({
  ...b,
  usedBy: refs.filter((r) => r.url === b.url).map((r) => `${r.where} #${r.id} ${r.label}`),
}));

if (JSON_OUT) {
  console.log(JSON.stringify({ checked: unique.length, broken: report }, null, 2));
} else if (!report.length) {
  console.log('\n✅ 깨진 이미지 없음');
} else {
  console.log(`\n🔴 깨진 이미지 ${report.length}건`);
  for (const b of report) {
    console.log(`\n  [${b.status}] ${b.url}`);
    for (const u of [...new Set(b.usedBy)]) console.log(`        ← ${u}`);
  }
}
process.exit(report.length ? 1 : 0);
