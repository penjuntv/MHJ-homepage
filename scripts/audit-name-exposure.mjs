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
  { label: 'child-H-rom', re: R('Yu' + '\\s?hy(eo|eu|u)n') }, // eo/eu/u 세 로마자 표기 전부 — name-guard hook 의 목록과 동일 범위
  { label: 'child-J-rom', re: R('Yu' + '\\s?jin') },
  { label: 'parent-Y', re: K(0xc720, 0xd76c, 0xc885) },
  { label: 'parent-HJ', re: R('Hee' + '\\s?jong') },
];

let allowlist = [];
try {
  allowlist = JSON.parse(readFileSync(new URL('./qa/name-exposure-allowlist.json', import.meta.url), 'utf8'));
} catch { /* 허용목록이 없으면 전부 보고 */ }

/* 출력은 public 리포의 CI 로그에 90일 남는다 — 스니펫 속 실명 자체는 라벨로 치환해서만 내보낸다.
   (감사 도구가 적발 순간에 그 이름을 공개 로그에 재유출하면 본말전도다.) */
const redact = (str) =>
  PATTERNS.reduce((t, p) => t.replace(new RegExp(p.re.source, p.re.flags), `[${p.label}]`), str);

const hits = [];
function scan(text, where) {
  if (!text) return;
  const s = String(text);
  for (const { label, re } of PATTERNS) {
    for (const m of s.matchAll(re)) {
      const ctx = s.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, ' ');
      // 허용목록 대조는 원문 스니펫으로, 저장·출력은 치환본으로.
      const allowed = allowlist.some((a) => a.pattern === label && ctx.includes(a.context));
      if (!allowed) hits.push({ label, where, ctx: redact(ctx) });
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
  /* PostgREST 는 기본 max-rows 캡(통상 1000행)을 넘는 행을 에러 없이 잘라서 준다 —
     comments 가 캡을 넘는 순간 초과분이 소리 없이 스캔에서 빠진다. 페이지네이션으로 전수 보장. */
  for (let off = 0; ; off += 500) {
    const { data, error } = await db.from(table).select('*').range(off, off + 499);
    if (error) throw new Error(`${table} 조회 실패 — ${error.message}`); // 조용한 누락 금지 (audit-broken-images 의 교훈)
    for (const row of data ?? []) scanValue(row, `db:${table} #${row.id ?? row.slug ?? row.key ?? '?'}`);
    if (!data || data.length < 500) break;
  }
}
console.log(`DB ${TABLES.length}개 테이블 스캔 완료`);

/* ── ② 라이브 전수 ── */
const unscanned = []; // fetch 실패는 "노출"이 아니라 "감사 불완전" — hits 와 절대 섞지 않는다
if (!DB_ONLY) {
  const smRes = await fetch(`${BASE}/sitemap.xml`, { signal: AbortSignal.timeout(20000) });
  if (!smRes.ok) throw new Error(`sitemap.xml HTTP ${smRes.status} — 라이브 스캔 대상 목록을 얻지 못했다`); // fail-open 금지
  const sm = await smRes.text();
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) throw new Error('sitemap.xml 에서 URL 을 하나도 못 읽었다 — 포맷 변경?');
  urls.push(`${BASE}/llms.txt`, `${BASE}/llms-full.txt`, `${BASE}/feed.xml`);

  async function fetchLive(u, attempt = 0) {
    try {
      const res = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (res.ok) return res.text();
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      // 일시적 502/콜드스타트를 P0 경보로 만들면 진짜 경보가 노이즈에 묻힌다 — 두 번 재시도.
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        return fetchLive(u, attempt + 1);
      }
      unscanned.push({ url: u, reason: String(e.message ?? e).slice(0, 60) });
      return null;
    }
  }

  const CONC = 10;
  for (let i = 0; i < urls.length; i += CONC) {
    await Promise.all(urls.slice(i, i + CONC).map(async (u) => {
      const body = await fetchLive(u);
      if (body) scan(body, `live:${u.replace(BASE, '')}`);
    }));
    process.stdout.write(`\r라이브 ${Math.min(i + CONC, urls.length)}/${urls.length}`);
  }
  console.log('');
}

if (unscanned.length) {
  console.log(`\n⚠️ 스캔 불가 ${unscanned.length}건 — 실명 노출이 아니라 "감사 불완전"이다 (3회 시도 후 실패)`);
  for (const s of unscanned) console.log(`  ${s.url} — ${s.reason}`);
}
if (hits.length) {
  console.log(`\n🔴 실명 노출 의심 ${hits.length}건 (허용목록 제외 후 — 스니펫의 이름은 [라벨]로 치환돼 있다)`);
  for (const h of hits) console.log(`  [${h.label}] ${h.where}\n      …${h.ctx}…`);
  console.log('\n오탐이면 scripts/qa/name-exposure-allowlist.json 에 {pattern, context, note} 로 등록.');
  process.exit(1);
}
if (unscanned.length) {
  console.log('\n🔴 노출 0건이지만 일부를 스캔하지 못했다 — 불완전한 통과를 ✅ 로 보고하지 않는다.');
  process.exit(1);
}
console.log('\n✅ 실명 노출 없음');
