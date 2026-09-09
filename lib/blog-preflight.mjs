/**
 * 발행 전 점검 규칙 — 한 곳에서만 정의한다.
 *
 * 왜 `lib/*.mjs` 인가: 같은 판정을 쓰는 곳이 셋이다 —
 *   ① BlogForm 의 발행 전 체크리스트(app/mhj-desk/blogs/_components/BlogForm.tsx)
 *   ② 관리자 SEO 감사 페이지(app/mhj-desk/seo/page.tsx, W4-D 에서 이 모듈로 갈아탄다)
 *   ③ 주간 회귀 감사(scripts/audit-seo-regression.mjs)
 * 규칙을 각자 복사하면 화면과 감사 수치가 어긋난다(og_image_url 폴백 정의는 이미 세 벌이었다).
 * `lib/content-html.mjs` 와 같은 선례 — 앱(TSX)과 node 테스트가 같은 코드를 쓴다.
 *
 * 판정 기준의 출처: docs/PLAN-search-visibility-2026-09.md §W4-C(preflight 목록),
 * .claude/skills/seo-audit-runner/SKILL.md(길이 기준), scripts/audit-seo-regression.mjs(결함 정규식).
 */
import { stripHtml, addHeadingIds, wrapKeyTakeaways, sanitizeFaq } from './content-html.mjs';

/** 본문+인포블록 합산 — 라이브 페이지에는 둘 다 렌더된다(감사 스크립트와 같은 기준). */
const bothHtml = (draft) => `${draft.content ?? ''}\n${draft.info_block_html ?? ''}`;

/** 내부 링크 수 — 상대경로이거나 mhj.nz 를 가리키는 <a>. */
export function internalLinkCount(html) {
  return (String(html ?? '').match(/href="(\/[^"]*|https?:\/\/(www\.)?mhj\.nz[^"]*)"/gi) ?? []).length;
}

/** 첫 문단의 단어 수 — "답 먼저" 문단(40~60단어)을 재는 값. */
export function firstParagraphWords(html) {
  const m = String(html ?? '').match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return 0;
  return stripHtml(m[1]).split(/\s+/).filter(Boolean).length;
}

/**
 * 서술형 alt 가 아닌 본문 이미지 수.
 * 빠졌거나(=alt 없음), 10자 미만이거나, 제목을 그대로 베낀 것은 서술이 아니다.
 */
export function weakAltCount(html, title = '') {
  const imgs = String(html ?? '').match(/<img\b[^>]*>/gi) ?? [];
  const t = String(title ?? '').trim().toLowerCase();
  return imgs.filter((tag) => {
    const alt = tag.match(/\salt\s*=\s*"([^"]*)"/i)?.[1] ?? tag.match(/\salt\s*=\s*'([^']*)'/i)?.[1];
    if (!alt) return true;
    const v = alt.trim();
    return v.length < 10 || (!!t && v.toLowerCase() === t);
  }).length;
}

/** 본문에 Key takeaways 박스가 잡히는가 — 렌더러와 **같은 함수**로 판정한다. */
export function hasKeyTakeaways(html) {
  const src = String(html ?? '');
  return wrapKeyTakeaways(src) !== src;
}

/**
 * 발행 전 점검 목록.
 * @param {object} draft 폼의 현재 값 — { title, content, info_block_html, image_url, slug,
 *   meta_description, seo_title, summary_ko, faq, related_slugs, cover_caption, isNew, willPublish }
 * @returns {{ id: string, label: string, required: boolean, ok: boolean, hint?: string }[]}
 *   `required` 는 저장을 막는 항목, 나머지는 경고만 한다(D3: 4주간 경고 모드).
 */
export function preflightChecks(draft = {}) {
  const content = draft.content ?? '';
  const plain = stripHtml(content);
  const both = bothHtml(draft);
  const headings = addHeadingIds(content).headings.length; // takeaways 라벨은 제외된 수
  const links = internalLinkCount(both);
  const firstWords = firstParagraphWords(content);
  const weakAlt = weakAltCount(both, draft.title);
  const faq = sanitizeFaq(draft.faq);
  const related = (draft.related_slugs ?? []).filter(Boolean);
  const seoTitle = (draft.seo_title ?? '').trim();
  const meta = (draft.meta_description ?? '').trim();
  const caption = (draft.cover_caption ?? '').trim();

  /** 신규 글을 **발행할 때만** 캡션을 필수로 본다 — 저장 버튼이 하나뿐이라
   *  초안 저장까지 막으면 글을 나눠 쓰는 흐름이 끊긴다. */
  const captionRequired = Boolean(draft.isNew && draft.willPublish);

  return [
    { id: 'title', label: '제목 입력', required: true, ok: (draft.title ?? '').trim().length > 0 },
    { id: 'body', label: '본문 50자 이상', required: true, ok: plain.length >= 50 },
    { id: 'cover', label: '커버 이미지', required: true, ok: (draft.image_url ?? '').trim().length > 0 },
    { id: 'slug', label: '슬러그', required: true, ok: (draft.slug ?? '').trim().length > 0 },
    {
      id: 'cover_caption',
      label: captionRequired ? '커버 캡션 (신규 발행 필수)' : '커버 캡션',
      required: captionRequired,
      ok: caption.length > 0,
      hint: '예: Photograph by Yussi, Mairangi Bay',
    },
    {
      id: 'meta_description',
      label: 'SEO 메타 설명 120~160자',
      required: false,
      ok: meta.length >= 120 && meta.length <= 160,
      hint: meta ? `현재 ${meta.length}자` : '비어 있음',
    },
    {
      id: 'seo_title',
      label: '검색 제목(seo_title) 30~60자',
      required: false,
      ok: seoTitle.length >= 30 && seoTitle.length <= 60,
      hint: seoTitle ? `현재 ${seoTitle.length}자` : '비우면 글 제목이 그대로 쓰인다',
    },
    { id: 'summary_ko', label: '한국어 요약', required: false, ok: (draft.summary_ko ?? '').trim().length > 0 },
    { id: 'faq', label: 'FAQ 2개 이상', required: false, ok: faq.length >= 2, hint: `현재 ${faq.length}개` },
    {
      id: 'answer_first',
      label: '첫 문단 40~60단어 (답 먼저)',
      required: false,
      ok: firstWords >= 40 && firstWords <= 60,
      hint: `현재 ${firstWords}단어`,
    },
    { id: 'h2', label: 'H2 소제목 3개 이상', required: false, ok: headings >= 3, hint: `현재 ${headings}개` },
    { id: 'takeaways', label: 'Key takeaways 목록', required: false, ok: hasKeyTakeaways(content), hint: '본문에 "Key takeaways" 제목 + 불릿 3~5개' },
    { id: 'internal_links', label: '내부 링크 2개 이상', required: false, ok: links >= 2, hint: `현재 ${links}개` },
    { id: 'related', label: '관련 글 2개 이상', required: false, ok: related.length >= 2, hint: `현재 ${related.length}개` },
    {
      id: 'alt',
      label: '이미지 alt 서술',
      required: false,
      ok: weakAlt === 0,
      hint: weakAlt ? `설명이 부족한 이미지 ${weakAlt}개` : undefined,
    },
  ];
}

/** 저장을 막는 항목 중 미충족 라벨. 비어 있으면 저장 가능. */
export function blockingFailures(draft) {
  return preflightChecks(draft).filter((c) => c.required && !c.ok).map((c) => c.label);
}
