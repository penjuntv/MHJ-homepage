/**
 * 발행 전 점검 규칙 — 한 곳에서만 정의한다.
 *
 * 왜 `lib/*.mjs` 인가: 같은 판정을 쓰는 곳이 셋이다 —
 *   ① BlogForm 의 발행 전 체크리스트(app/mhj-desk/blogs/_components/BlogForm.tsx)
 *   ② (예정) 발행 전 차단 훅 — D3 의 경고 모드 4주 뒤
 * 감사 쪽(주간 스크립트·관리자 SEO 화면)은 **다른 잣대**를 쓴다 — `lib/seo-defects.mjs`(결함 기준선).
 * 이 모듈은 발행 템플릿 목표치다. 수치를 섞지 말 것.
 * 규칙을 각자 복사하면 화면과 감사 수치가 어긋난다(og_image_url 폴백 정의는 이미 세 벌이었다).
 * `lib/content-html.mjs` 와 같은 선례 — 앱(TSX)과 node 테스트가 같은 코드를 쓴다.
 *
 * ⚠️ `scripts/audit-seo-regression.mjs` 와 **기준이 다르다. 일부러 다르다.**
 *   · 감사 스크립트 = **결함 기준선**(내부링크 0개=ORPHAN, 400단어 미만=THIN, alt 속성 없음).
 *     분기 회귀를 같은 잣대로 추적하려고 `scripts/qa/seo-baseline.json` 에 수치가 동결돼 있다.
 *   · 이 모듈 = **발행 템플릿 목표치**(내부링크 2개, H2 3개, 서술형 alt). 새 글이 도달해야 할 선이다.
 *   그래서 같은 글이 감사에서는 통과하고 폼에서는 권장 미충족일 수 있다(실측 80편 중 63편이 내부링크
 *   판정이 갈린다). 어느 쪽 수치를 인용하는지 늘 밝힐 것. 기준선을 이 목표치로 바꾸면 회귀 이력이 끊긴다.
 *
 * 판정 기준의 출처: docs/PLAN-search-visibility-2026-09.md §W4-C(preflight 목록),
 * .claude/skills/seo-audit-runner/SKILL.md(길이 기준), 발행 템플릿(같은 문서 §W5).
 */
import { stripHtml, addHeadingIds, wrapKeyTakeaways, sanitizeFaq } from './content-html.mjs';

/** 본문+인포블록 합산 — 라이브 페이지에는 둘 다 렌더된다(감사 스크립트와 같은 기준). */
const bothHtml = (draft) => `${draft.content ?? ''}\n${draft.info_block_html ?? ''}`;

/**
 * 내부 링크 수 — 상대경로이거나 mhj.nz 를 가리키는 <a>.
 * 작은따옴표도 받는다(인포블록은 손으로 쓴 HTML 이다) — `//cdn.example.com` 같은 프로토콜 상대 URL 은
 * 슬래시로 시작하지만 외부라 제외한다.
 */
export function internalLinkCount(html) {
  const hrefs = [...String(html ?? '').matchAll(/href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
    .map((m) => (m[1] ?? m[2] ?? '').trim());
  return hrefs.filter((h) =>
    (h.startsWith('/') && !h.startsWith('//')) || /^https?:\/\/(www\.)?mhj\.nz/i.test(h)).length;
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
 *   meta_description, seo_title, summary_ko, faq(=faq_json), related_slugs, cover_caption,
 *   willPublish(저장 후 공개되는가), alreadyPublished(이미 공개된 글인가) }
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
  const imageCount = (both.match(/<img\b/gi) ?? []).length;
  const weakAlt = weakAltCount(both, draft.title);
  // 폼은 `faq`, DB 행은 `faq_json` — 행을 그대로 넘기는 호출자가 있어도 같은 수가 나와야 한다.
  const faq = sanitizeFaq(draft.faq ?? draft.faq_json);
  const related = (draft.related_slugs ?? []).filter(Boolean);
  const seoTitle = (draft.seo_title ?? '').trim();
  const meta = (draft.meta_description ?? '').trim();
  const caption = (draft.cover_caption ?? '').trim();

  /** 캡션은 **처음 공개될 때** 필수다. 저장 버튼이 하나뿐이라 초안 저장까지 막으면 글을 나눠 쓸 수 없고,
   *  반대로 "신규 글"(=첫 저장) 로만 재면 초안으로 저장했다가 나중에 발행하는 흐름이 규칙을 그냥 지나친다. */
  const captionRequired = Boolean(draft.willPublish && !draft.alreadyPublished);

  return [
    { id: 'title', label: '제목 입력', required: true, ok: (draft.title ?? '').trim().length > 0 },
    { id: 'body', label: '본문 50자 이상', required: true, ok: plain.length >= 50 },
    { id: 'cover', label: '커버 이미지', required: true, ok: (draft.image_url ?? '').trim().length > 0 },
    { id: 'slug', label: '슬러그', required: true, ok: (draft.slug ?? '').trim().length > 0 },
    {
      id: 'cover_caption',
      label: captionRequired ? '커버 캡션 (첫 발행 필수)' : '커버 캡션',
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
    { id: 'body_image', label: '본문 이미지', required: false, ok: imageCount > 0, hint: '본문에 사진이 없다' },
    { id: 'h2', label: 'H2 소제목 3개 이상 (템플릿 목표)', required: false, ok: headings >= 3, hint: `현재 ${headings}개` },
    { id: 'takeaways', label: 'Key takeaways 목록', required: false, ok: hasKeyTakeaways(content), hint: '본문에 "Key takeaways" 제목 + 불릿 3~5개' },
    { id: 'internal_links', label: '내부 링크 2개 이상 (템플릿 목표)', required: false, ok: links >= 2, hint: `현재 ${links}개` },
    { id: 'related', label: '관련 글 2개 이상', required: false, ok: related.length >= 2, hint: `현재 ${related.length}개` },
    {
      id: 'alt',
      label: '이미지 alt 서술',
      required: false,
      // 이미지가 없으면 alt 를 볼 것도 없다 — 그 사실은 위의 '본문 이미지' 행이 말한다.
      ok: weakAlt === 0,
      hint: weakAlt ? `설명이 부족한 이미지 ${weakAlt}개` : (imageCount === 0 ? '본문 이미지 없음' : undefined),
    },
  ];
}

/** 저장을 막는 항목 중 미충족 라벨. 비어 있으면 저장 가능. */
export function blockingFailures(draft) {
  return preflightChecks(draft).filter((c) => c.required && !c.ok).map((c) => c.label);
}
