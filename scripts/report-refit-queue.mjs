#!/usr/bin/env node
/**
 * W5 정비 큐 생성 — 어떤 글을 어떤 순서로 손볼지의 **처방 목록**을 라이브 데이터에서 뽑는다.
 *
 * Usage:
 *   node --env-file=.env.local scripts/report-refit-queue.mjs            # 표준출력
 *   node --env-file=.env.local scripts/report-refit-queue.mjs --write    # docs/W5-refit-queue.md 에 저장
 *   ... --top=20                                                        # 상위 N편(기본 20)
 *
 * ⚠️ 이 스크립트는 **본문을 고치지 않는다**. 콘텐츠는 두 분이 쓴다(마스터 플랜 §W5:
 * "처방은 목록까지 — 본문 수정은 두 분"). 여기서 나오는 건 "무엇이 비어 있는가" 뿐이다.
 *
 * 판정은 `lib/seo-defects.mjs`(결함 기준선) 하나만 쓴다 — 관리자 화면·주간 감사와 같은 함수라
 * 여기 적힌 숫자를 그대로 인용해도 어긋나지 않는다.
 * 우선순위 = 조회수 × 결함 수(플랜 §W5 의 "조회 × 결함"). 읽히는 글부터 고쳐야 효과가 크다.
 */
import { writeFileSync } from 'node:fs';
import { requireAdminClient, paged } from './lib/audit-shared.mjs';
import { flagsOf, FLAG_META } from '../lib/seo-defects.mjs';
import { stripHtml, addHeadingIds, wrapKeyTakeaways } from '../lib/content-html.mjs';
import { internalLinkCount, weakAltCount } from '../lib/blog-preflight.mjs';

const WRITE = process.argv.includes('--write');
const TOP = Number(process.argv.find((a) => a.startsWith('--top='))?.slice(6) ?? 20);
const OUT = new URL('../docs/W5-refit-queue.md', import.meta.url);

/** 플래그 → 사람이 바로 실행할 수 있는 문장. 숫자는 실측값을 넣는다. */
function prescriptionsFor(b, facts) {
  const out = [];
  const has = (f) => b.flags.includes(f);
  if (has('H1_OVER')) out.push('본문 안의 `<h1>` 제거 — 페이지 제목과 충돌한다');
  if (has('META_MISSING')) out.push('meta_description 작성(120~160자)');
  if (has('ALT_MISSING')) out.push(`이미지 alt 채우기 — 설명이 없는 사진 ${facts.weakAlt}장`);
  if (has('ORPHAN')) out.push('내부 링크 2개 이상(허브 1개 포함) — 지금 0개라 색인에서 고립돼 있다');
  else if (facts.links < 2) out.push(`내부 링크 ${2 - facts.links}개 더(허브 1개 포함) — 현재 ${facts.links}개`);
  if (has('THIN')) out.push(`본문 확장 — 현재 ${facts.words}단어, 400단어가 기준선`);
  if (has('NO_H2')) out.push(`H2 소제목 추가 — 현재 ${facts.h2}개`);
  else if (facts.h2 < 3) out.push(`H2 소제목 ${3 - facts.h2}개 더(1개는 질문형) — 현재 ${facts.h2}개`);
  if (has('NO_GEO')) out.push('지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나');
  if (has('OG_FALLBACK')) out.push('대표 사진 지정(지금은 자동 생성 이미지로 공유된다)');
  if (!facts.takeaways) out.push('Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)');
  if (has('NO_SEO_TITLE')) out.push('seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만');
  if (has('NO_SUMMARY_KO')) out.push('한국어 요약 2~3문단');
  if (has('NO_FAQ')) out.push('FAQ 2~3개');
  if (has('NO_TAGS')) out.push('태그');
  if (has('STOCK_IMAGE')) out.push('스톡 이미지를 직접 찍은 사진으로');
  return out;
}

const db = requireAdminClient();
const rows = [];
for await (const b of paged(() =>
  db.from('blogs')
    .select('slug, title, category, view_count, content, info_block_html, meta_description, og_image_url, seo_title, summary_ko, faq_json, tags, image_url, updated_at, created_at')
    .eq('published', true)
    .or('publish_at.is.null,publish_at.lte.now'),
)) rows.push(b);

const scored = rows.map((b) => {
  const flags = flagsOf(b);
  const both = `${b.content ?? ''}\n${b.info_block_html ?? ''}`;
  const facts = {
    words: stripHtml(b.content).split(/\s+/).filter(Boolean).length,
    h2: addHeadingIds(b.content ?? '').headings.length,
    links: internalLinkCount(both),
    weakAlt: weakAltCount(both, b.title),
    takeaways: wrapKeyTakeaways(b.content ?? '') !== (b.content ?? ''),
  };
  const baselineDefects = flags.filter((f) => FLAG_META[f]?.baseline).length;
  const hard = flags.filter((f) => FLAG_META[f]?.hard).length;
  return {
    ...b, flags, facts, baselineDefects, hard,
    // 읽히는 글의 결함이 더 비싸다. 조회 0 인 글도 결함이 있으면 큐에 남도록 +1
    // (괄호 없이 `?? 0 + 1` 로 쓰면 `?? 1` 이 돼 조회 0 인 글이 전부 0점으로 가라앉는다).
    score: ((b.view_count ?? 0) + 1) * baselineDefects,
  };
});

const queue = scored
  .filter((b) => b.baselineDefects > 0)
  .sort((a, b) => b.score - a.score || b.hard - a.hard || (b.view_count ?? 0) - (a.view_count ?? 0));

const totals = {};
for (const b of scored) for (const f of b.flags) totals[f] = (totals[f] ?? 0) + 1;

const lines = [];
lines.push('# W5 정비 큐 — 무엇을 먼저 고칠까');
lines.push('');
lines.push(`> \`node --env-file=.env.local scripts/report-refit-queue.mjs --write\` 로 다시 만든다. 생성일 ${new Date().toISOString().slice(0, 10)} · 발행 ${scored.length}편.`);
lines.push('> **본문은 두 분이 쓴다.** 이 문서는 "무엇이 비어 있는지"만 말한다(마스터 플랜 §W5).');
lines.push('> 판정은 `lib/seo-defects.mjs` — 관리자 화면(`/mhj-desk/seo`)·주간 감사와 같은 함수다.');
lines.push('');
lines.push('## 전체 현황');
lines.push('');
lines.push('| 항목 | 해당 글 | 성격 |');
lines.push('|---|---|---|');
for (const c of Object.values(FLAG_META)) {
  const n = totals[c.flag] ?? 0;
  if (n === 0) continue;
  lines.push(`| ${c.label} | ${n} | ${c.hard ? '필수 결함' : c.baseline ? '기준선 경고' : '운영 지표'} |`);
}
lines.push('');
lines.push(`결함이 하나도 없는 글 ${scored.filter((b) => b.baselineDefects === 0).length}편. 아래 큐는 기준선 결함이 있는 ${queue.length}편을 조회수 × 결함 수로 정렬한 것이다.`);
lines.push('');
lines.push(`## 정비 큐 (상위 ${Math.min(TOP, queue.length)}편)`);
lines.push('');
for (const [i, b] of queue.slice(0, TOP).entries()) {
  lines.push(`### ${i + 1}. [${b.title}](https://www.mhj.nz/blog/${b.slug})`);
  lines.push('');
  lines.push(`\`${b.slug}\` · ${b.category} · 조회 ${b.view_count ?? 0} · 본문 ${b.facts.words}단어 · H2 ${b.facts.h2} · 내부링크 ${b.facts.links}`);
  lines.push('');
  for (const p of prescriptionsFor(b, b.facts)) lines.push(`- [ ] ${p}`);
  lines.push('');
}
lines.push('## 전 편 공통 (W4-C 폼에서 채운다)');
lines.push('');
lines.push('`seo_title` · 한국어 요약 · FAQ · 관련 글은 현재 거의 모든 글이 비어 있다. 큐를 도는 김에 함께 채우면 두 번 열지 않는다.');
lines.push('글을 저장할 때 폼 아래 "발행 전 체크리스트"가 남은 항목을 그대로 보여준다.');
lines.push('');
lines.push('---');
lines.push('');
lines.push('정비 한 단락이 끝날 때마다: `node --env-file=.env.local scripts/audit-seo-regression.mjs --update-baseline`');
lines.push('');

const body = lines.join('\n');
if (WRITE) {
  writeFileSync(OUT, body);
  console.log(`docs/W5-refit-queue.md 갱신 — 큐 ${queue.length}편 중 상위 ${Math.min(TOP, queue.length)}편 기재`);
} else {
  console.log(body);
}
