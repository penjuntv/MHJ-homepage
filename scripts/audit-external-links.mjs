#!/usr/bin/env node
/**
 * 외부 링크 rot 감사 — 발행 글 본문·인포블록의 외부 링크가 아직 살아 있는지 확인한다.
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-external-links.mjs
 *
 * Exit code: 재시도 후에도 404/410 인 링크가 있으면 1.
 *   403/429/999/타임아웃은 봇 차단일 가능성이 높아 SKIP 으로만 보고한다(오탐 방지).
 *
 * 왜 필요한가:
 *   fact-verify 스킬은 발행 "전" 검증이다. NZ 지역 링크(카운슬·학교·행사 페이지)는
 *   발행 후에도 수시로 사라진다 — 죽은 링크는 독자 신뢰와 SEO 양쪽을 깎는다.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요하다.');
  console.error('실행: node --env-file=.env.local scripts/audit-external-links.mjs');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: blogs, error } = await db
  .from('blogs')
  .select('slug,content,info_block_html')
  .eq('published', true)
  .or('publish_at.is.null,publish_at.lte.now');
if (error) throw new Error(`blogs 조회 실패 — ${error.message}`);

/* 본문 + 인포블록에서 외부 href 수집 (mhj.nz 는 sitemap 감사가 커버) */
const refs = [];
for (const b of blogs) {
  for (const html of [b.content, b.info_block_html]) {
    for (const m of String(html ?? '').matchAll(/href="(https?:\/\/[^"]+)"/gi)) {
      const u = m[1];
      if (!/^https?:\/\/(www\.)?mhj\.nz/.test(u)) refs.push({ url: u, slug: b.slug });
    }
  }
}
const unique = [...new Set(refs.map((r) => r.url))];
console.log(`외부 링크 ${refs.length}건 · 고유 ${unique.length}건 — 확인 중…`);

const UA = 'Mozilla/5.0 (compatible; MHJ-link-audit/1.0; +https://www.mhj.nz)';
async function check(u, attempt = 0) {
  try {
    const res = await fetch(u, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (res.ok) return null;
    const get = await fetch(u, { redirect: 'follow', headers: { 'User-Agent': UA, Range: 'bytes=0-512' }, signal: AbortSignal.timeout(15000) });
    return get.ok ? null : get.status;
  } catch (e) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      return check(u, attempt + 1);
    }
    return `ERR ${String(e.message ?? e).slice(0, 30)}`;
  }
}

const dead = [], skipped = [];
const CONC = 8;
for (let i = 0; i < unique.length; i += CONC) {
  const slice = unique.slice(i, i + CONC);
  const results = await Promise.all(slice.map((u) => check(u)));
  slice.forEach((u, k) => {
    const s = results[k];
    if (s === null) return;
    // 404/410 만 확정 rot. 403/429/999(LinkedIn 등)·ERR 은 봇 차단 가능성 — SKIP.
    (s === 404 || s === 410 ? dead : skipped).push({ url: u, status: s });
  });
  process.stdout.write(`\r  ${Math.min(i + CONC, unique.length)}/${unique.length}`);
}
console.log('');

if (skipped.length) {
  console.log(`\n⚠️ 판정 보류(봇 차단 의심) ${skipped.length}건 — 사람이 한 번 열어볼 것`);
  for (const s of skipped) console.log(`  [${s.status}] ${s.url}`);
}
if (!dead.length) {
  console.log('\n✅ 확정 죽은 링크 없음');
  process.exit(0);
}
console.log(`\n🔴 죽은 외부 링크 ${dead.length}건`);
for (const d of dead) {
  console.log(`  [${d.status}] ${d.url}`);
  for (const r of refs.filter((x) => x.url === d.url)) console.log(`        ← /blog/${r.slug}`);
}
process.exit(1);
