#!/usr/bin/env node
/**
 * 본문에서 "원본이 사라진 이미지" 블록을 제거한다.
 *
 * Usage:
 *   node --env-file=.env.local scripts/remove-broken-image-figures.mjs            # dry-run
 *   node --env-file=.env.local scripts/remove-broken-image-figures.mjs --apply
 *
 * 대상은 scripts/audit-broken-images.mjs 가 찾아낸 깨진 URL 이다.
 * 스토리지에서 사라진 파일을 가리키는 <figure>…</figure> 를 통째로 지운다
 * (figure 가 아니면 <img> 태그만 지운다). 살아 있는 이미지는 절대 건드리지 않는다.
 *
 * 안전장치
 *   - 기본이 dry-run. --apply 없이는 아무것도 쓰지 않는다.
 *   - 변경 전 본문 전체를 qa-reports/ 에 백업한다.
 *   - 제거 대상 URL 이 실제로 죽었는지 실행 시점에 다시 확인한다(살아 있으면 건너뜀).
 *   - 제거 후 남은 본문 길이가 원본의 50% 미만이면 중단한다(정규식 폭주 방지).
 */
import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('.env.local 의 Supabase 키가 필요하다.'); process.exit(2); }
const db = createClient(url, key, { auth: { persistSession: false } });

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** url 을 src 로 갖는 <figure> 블록(없으면 <img> 태그)을 본문에서 제거한다. */
function removeBlock(html, imgUrl) {
  const u = escapeRe(imgUrl);
  const figure = new RegExp(`\\s*<figure\\b[^>]*>(?:(?!</figure>)[\\s\\S])*?${u}[\\s\\S]*?</figure>`, 'i');
  if (figure.test(html)) return { html: html.replace(figure, ''), kind: 'figure' };
  const img = new RegExp(`\\s*<img\\b[^>]*${u}[^>]*/?>`, 'i');
  if (img.test(html)) return { html: html.replace(img, ''), kind: 'img' };
  return { html, kind: null };
}

async function isDead(u) {
  try {
    const r = await fetch(u, { method: 'HEAD' });
    if (r.ok) return false;
    const g = await fetch(u, { headers: { Range: 'bytes=0-0' } });
    return !g.ok;
  } catch { return false; }   // 네트워크 오류는 "죽었다"로 보지 않는다
}

const { data: blogs, error } = await db.from('blogs').select('id,slug,title,content');
if (error) { console.error('blogs 조회 실패:', error.message); process.exit(1); }

const URL_RE = /https?:\/\/[^\s"'<>()\\]+/g;
const plans = [];
for (const b of blogs ?? []) {
  const urls = [...new Set((b.content ?? '').match(URL_RE) ?? [])]
    .map((s) => s.replace(/[.,)\]]+$/, ''))
    .filter((s) => s.includes('/storage/v1/object/public/'));
  for (const u of urls) {
    if (!(await isDead(u))) continue;
    const r = removeBlock(b.content, u);
    if (!r.kind) { console.log(`⚠ blog #${b.id}: 깨진 URL 이지만 제거할 블록을 못 찾음 — ${u}`); continue; }
    plans.push({ id: b.id, slug: b.slug, title: b.title, url: u, kind: r.kind, before: b.content, after: r.html });
  }
}

if (!plans.length) { console.log('✅ 제거할 깨진 이미지 블록 없음'); process.exit(0); }

console.log(`제거 대상 ${plans.length}건\n`);
for (const p of plans) {
  const removed = p.before.length - p.after.length;
  console.log(`  blog #${p.id} /blog/${p.slug} — ${p.title}`);
  console.log(`    ${p.kind} 블록 ${removed}자 제거 (${p.before.length} → ${p.after.length})`);
  console.log(`    ${p.url.split('/').pop()}`);
  if (p.after.length < p.before.length * 0.5) {
    console.error('🔴 본문이 절반 이하로 줄어든다 — 정규식 이상. 중단.');
    process.exit(1);
  }
}

if (!APPLY) { console.log('\ndry-run 이다. 반영하려면 --apply 를 붙일 것.'); process.exit(0); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.resolve('qa-reports', `broken-figure-backup-${stamp}.json`);
await fs.mkdir(path.dirname(backup), { recursive: true });
await fs.writeFile(backup, JSON.stringify(plans.map(({ id, slug, url, before }) => ({ id, slug, url, before })), null, 2));
console.log(`\n원본 백업: ${backup}`);

for (const p of plans) {
  const { error: e } = await db.from('blogs').update({ content: p.after }).eq('id', p.id);
  console.log(e ? `  🔴 blog #${p.id} 실패: ${e.message}` : `  ✅ blog #${p.id} 반영`);
}

if (process.env.REVALIDATION_SECRET) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';
  const paths = ['/blog', '/gallery', '/', ...plans.map((p) => `/blog/${p.slug}`)];
  try {
    const r = await fetch(`${site}/api/revalidate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.REVALIDATION_SECRET, paths }),
    });
    console.log(`캐시 무효화: HTTP ${r.status}`);
  } catch (e) { console.log('캐시 무효화 실패:', e.message); }
}
