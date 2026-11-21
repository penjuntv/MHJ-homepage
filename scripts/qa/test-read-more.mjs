#!/usr/bin/env node
/**
 * 글 끝 Read More 2칸 고르기(lib/read-more-picks.mjs) 회귀 테스트.
 *   node scripts/qa/test-read-more.mjs
 * 2026-11-22 PeNnY·유씨 결정: 같은 크기 박스 2편. 순서 = 유씨 선택 → 같은 카테고리 다음 글 → 같은 카테고리 최신 글.
 * 화면 연결(ContinueReading 이 picks 만 그리는지·관리자 최대 2편)도 함께 지킨다.
 */
import { readFileSync } from 'node:fs';
import { pickReadMore, READ_MORE_SLOTS } from '../../lib/read-more-picks.mjs';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`}`);
};
const P = (slug) => ({ slug });
const pick = (...a) => pickReadMore(...a).map((p) => `${p.slug}:${p.source}`);

eq('칸 수는 2', READ_MORE_SLOTS, 2);
eq('유씨가 2편 고르면 그 2편(고른 순서)', pick('cur', [P('a'), P('b')], P('n'), [P('l1')]), ['a:editor', 'b:editor']);
eq('유씨가 3편 골라 둔 옛 글 — 앞 2편만', pick('cur', [P('a'), P('b'), P('c')], P('n'), []), ['a:editor', 'b:editor']);
eq('1편만 고르면 다음 글로 채움', pick('cur', [P('a')], P('n'), [P('l1')]), ['a:editor', 'n:next']);
eq('안 고르면 다음 글 + 최신 글', pick('cur', [], P('n'), [P('l1'), P('l2')]), ['n:next', 'l1:drawer']);
eq('고른 글 = 다음 글이면 한 번만, 최신 글로 채움', pick('cur', [P('n')], P('n'), [P('n'), P('l1')]), ['n:editor', 'l1:drawer']);
eq('지금 글은 빠진다', pick('cur', [P('cur')], null, [P('cur'), P('l1'), P('l2')]), ['l1:drawer', 'l2:drawer']);
eq('카테고리에 지금 글뿐이면 빈 묶음', pick('cur', [], null, [P('cur')]), []);
eq('다음 글이 없으면(null) 최신 글로', pick('cur', [], null, [P('l1'), P('l2'), P('l3')]), ['l1:drawer', 'l2:drawer']);

// 연결
const comp = readFileSync(new URL('../../app/(public)/blog/[slug]/ContinueReading.tsx', import.meta.url), 'utf8');
eq('묶음 제목은 Read More', />Read More</.test(comp), true);
eq('예전 큰 다음 글 카드는 없다', /post-continue-next/.test(comp), false);
const page = readFileSync(new URL('../../app/(public)/blog/[slug]/page.tsx', import.meta.url), 'utf8');
eq('상세 페이지가 pickReadMore 로 2칸을 고른다', /pickReadMore\(blog\.slug, relatedBlogs, drawerNext\.post, drawerLatest, READ_MORE_SLOTS\)/.test(page), true);
const admin = readFileSync(new URL('../../app/mhj-desk/blogs/_components/RelatedSuggestions.tsx', import.meta.url), 'utf8');
eq('관리자 고르기는 READ_MORE_SLOTS 편까지', /selected\.length >= READ_MORE_SLOTS/.test(admin), true);

console.log(`\n${fail ? '❌' : '✅'} ${pass} 통과 · ${fail} 실패`);
process.exit(fail ? 1 : 0);
