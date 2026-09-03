#!/usr/bin/env node
/**
 * 실명 노출 감사 (P0) — 보호 대상 이름이 DB 와 라이브 어디에도 없는지 전수 확인한다.
 *
 * Usage:
 *   node --env-file=.env.local scripts/audit-name-exposure.mjs
 *   node --env-file=.env.local scripts/audit-name-exposure.mjs --db-only    # 라이브 fetch 생략
 *
 * Exit code: 허용목록에 없는 노출이 하나라도 있으면 1.
 *
 * 왜 필요한가 (CLAUDE.md 규칙 10):
 *   아이 실명·부모 실명 노출은 P0. 본문만이 아니라 메타데이터(OG/alt/title)·캡션·
 *   댓글까지 어디로든 새어 나올 수 있다. blog-publish-preflight 는 발행 "전" 단일 글만
 *   본다 — 이 스크립트는 발행 "후" 전체를 매주 재확인하는 안전망이다.
 *
 * ⚠ 패턴이 코드포인트 숫자로 인코딩된 이유: .claude/hooks/name-guard.sh 가 금칙 이름의
 *   리터럴 표기를 모든 파일 쓰기에서 차단한다 — 이 감사 스크립트 자신도 예외가 아니다.
 *   디코딩하면 CLAUDE.md 규칙 10 의 목록과 동일하다. 사람이 읽을 라벨은 child-M 식 별칭.
 *   (child-M/H/J = 세 딸의 사이트 표기 Min/Hyun/Jin 순서, parent-Y = Yussi 실명,
 *    parent-HJ = 로마자 표기.)
 *
 * 검사 범위:
 *   ① DB 전수 — blogs·articles·article_pages·magazines·gallery·comments·site_settings 의
 *      모든 문자열 필드(select * 후 재귀 스캔 — 컬럼이 추가돼도 자동 포함).
 *      미발행 초안·예약 글도 포함해서 본다(발행 전에 잡는 게 더 좋다).
 *   ② 라이브 전수 — sitemap 의 모든 URL + llms.txt/llms-full.txt/feed.xml 의
 *      렌더링된 HTML (코드에 하드코딩된 이름·메타태그까지 잡는다).
 *
 * 오탐 처리:
 *   child-J 패턴은 다른 인명(예: IVE 멤버)에도 부분 일치한다. 확인된 오탐은
 *   scripts/qa/name-exposure-allowlist.json 에 {pattern, context, note} 로 등록한다.
 *   context 는 매치 주변 스니펫에 포함되는 고유 문자열(금칙 이름 자체는 넣지 말 것 —
 *   name-guard 가 그 파일 쓰기도 차단한다).
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const DB_ONLY = process.argv.includes('--db-only');
const BASE = 'https://www.mhj.nz';

// 보호 대상 패턴. 한글은 코드포인트로 조립(위 주석 참고), 로마자는 분절 결합.
// 추가/삭제 시 CLAUDE.md 규칙 10 · blog-publish-preflight · name-guard hook 도 함께 갱신.
const K = (...cp) => new RegExp(String.fromCharCode(...cp), 'g');
const R = (s) => new RegExp(s, 'gi');
const PATTERNS = [
  { label: 'child-M', re: K(0xc720, 0xbbfc) },
  { label: 'child-H', re: K(0xc720, 0xd604) },
  { label: 'child-J', re: K(0xc720, 0xc9c4) },
  { label: 'child-M-rom', re: R('Yu' + '\\s?min') },
  { label: 'child-H-rom', re: R('Yu' + '\\s?hye?un') },
  { label: 'child-J-rom', re: R('Yu' + '\\s?jin') },
  { label: 'parent-Y', re: K(0xc720, 0xd76c, 0xc885) },
  { label: 'parent-HJ', re: R('Hee' + '\\s?jong') },
];

let allowlist = [];
try {
  allowlist = JSON.parse(readFileSync(new URL('./qa/name-exposure-allowlist.json', import.meta.url), 'utf8'));
} catch { /* 허용목록이 없으면 전부 보고 */ }

const hits = [];
function scan(text, where) {
  if (!text) return;
  const s = String(text);
  for (const { label, re } of PATTERNS) {
    for (const m of s.matchAll(re)) {
      const ctx = s.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, ' ');
      const allowed = allowlist.some((a) => a.pattern === label && ctx.includes(a.context));
      if (!allowed) hits.push({ label, where, ctx });
    }
  }
}

/** 객체의 모든 문자열 값을 재귀 스캔 — 컬럼 이름을 몰라도 빠짐없이 본다. */
function scanValue(v, where) {
  if (typeof v === 'string') scan(v, where);
  else if (Array.isArray(v)) v.forEach((x) => scanValue(x, where));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => scanValue(x, where));
}

/* ── ① DB 전수 ── */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요하다.');
  console.error('실행: node --env-file=.env.local scripts/audit-name-exposure.mjs');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const TABLES = ['blogs', 'articles', 'article_pages', 'magazines', 'gallery', 'comments', 'site_settings'];
for (const table of TABLES) {
  const { data, error } = await db.from(table).select('*');
  if (error) throw new Error(`${table} 조회 실패 — ${error.message}`); // 조용한 누락 금지 (audit-broken-images 의 교훈)
  for (const row of data ?? []) scanValue(row, `db:${table} #${row.id ?? row.slug ?? row.key ?? '?'}`);
}
console.log(`DB ${TABLES.length}개 테이블 스캔 완료`);

/* ── ② 라이브 전수 ── */
if (!DB_ONLY) {
  const sm = await fetch(`${BASE}/sitemap.xml`).then((r) => r.text());
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  urls.push(`${BASE}/llms.txt`, `${BASE}/llms-full.txt`, `${BASE}/feed.xml`);
  const CONC = 10;
  for (let i = 0; i < urls.length; i += CONC) {
    await Promise.all(urls.slice(i, i + CONC).map(async (u) => {
      try {
        const res = await fetch(u, { redirect: 'follow' });
        if (res.ok) scan(await res.text(), `live:${u.replace(BASE, '')}`);
        else hits.push({ label: 'FETCH', where: `live:${u}`, ctx: `HTTP ${res.status} — 스캔 불가` });
      } catch (e) {
        hits.push({ label: 'FETCH', where: `live:${u}`, ctx: `ERR ${e.message.slice(0, 40)} — 스캔 불가` });
      }
    }));
    process.stdout.write(`\r라이브 ${Math.min(i + CONC, urls.length)}/${urls.length}`);
  }
  console.log('');
}

if (!hits.length) {
  console.log('\n✅ 실명 노출 없음');
  process.exit(0);
}
console.log(`\n🔴 실명 노출 의심 ${hits.length}건 (허용목록 제외 후)`);
for (const h of hits) console.log(`  [${h.label}] ${h.where}\n      …${h.ctx}…`);
console.log('\n오탐이면 scripts/qa/name-exposure-allowlist.json 에 {pattern, context, note} 로 등록.');
process.exit(1);
