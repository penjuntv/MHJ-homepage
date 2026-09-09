/**
 * SEO **결함 기준선** — 주간 회귀 감사와 관리자 감사 페이지가 같은 판정을 쓰게 하는 한 곳.
 *
 * 두 종류의 잣대가 있다. 헷갈리면 수치가 어긋난다:
 *   · **이 파일** = 결함 기준선. "이것마저 안 돼 있다" 는 선이고, 분기 회귀를 같은 잣대로
 *     추적하려고 `scripts/qa/seo-baseline.json` 에 수치가 동결돼 있다. 임계값을 올리면 이력이 끊긴다.
 *   · `lib/blog-preflight.mjs` = 발행 템플릿 목표치(내부링크 2개·H2 3개·서술형 alt). 새 글이 도달할 선.
 *   같은 글이 여기서는 통과하고 폼에서는 권장 미충족일 수 있다(실측 80편 중 63편이 내부링크 판정이 갈린다).
 *
 * 소비자: `scripts/audit-seo-regression.mjs`(주간 CI) · `app/mhj-desk/seo/page.tsx`(관리자 화면).
 * `.claude/skills/seo-audit-runner/SKILL.md` 의 SQL 과도 **한 쌍**이다 — 여기를 고치면 그 SQL 도 고칠 것.
 *
 * 대상 구분(2026-09-04 합의): ① 단어 수·H2 는 본문(content)만 ② ALT/ORPHAN/H1 은 라이브에 함께
 * 렌더링되는 info_block_html 포함 ③ GEO 는 태그를 벗긴 보이는 텍스트만(내부링크 URL 의 mhj.nz 오탐 방지).
 */

/** og:image 자동 생성 폴백 판정 — scripts/lib/http-audit.mjs 의 isOgApi 와 같은 정규식. */
export const isOgApi = (url) => /\/api\/og(\?|$)/.test(url ?? '');

/**
 * 검사 정의는 이 표 한 곳에만 — 플래그·집계 키·hard/soft·화면 라벨을 여러 군데 적으면
 * 새 검사를 추가할 때 하나를 빠뜨려도 출력엔 보이는데 게이트만 무장해제된다.
 * `baseline: true` 인 것만 seo-baseline.json 에 집계돼 주간 회귀 게이트가 된다.
 */
export const CHECKS = [
  { key: 'h1_over',      flag: 'H1_OVER',      hard: true,  baseline: true,  label: '본문에 H1 중복', hint: '페이지의 <h1> 과 충돌한다' },
  { key: 'alt_missing',  flag: 'ALT_MISSING',  hard: true,  baseline: true,  label: 'alt 없는 이미지' },
  { key: 'orphan',       flag: 'ORPHAN',       hard: true,  baseline: true,  label: '내부 링크 0개', hint: '고아 글 — 색인에 불리하다' },
  { key: 'meta_missing', flag: 'META_MISSING', hard: true,  baseline: true,  label: 'meta_description 없음' },
  { key: 'thin',         flag: 'THIN',         hard: false, baseline: true,  label: '400단어 미만' },
  { key: 'no_h2',        flag: 'NO_H2',        hard: false, baseline: true,  label: 'H2 소제목 부족', hint: '400단어 이상인데 H2 가 2개 미만' },
  { key: 'no_geo',       flag: 'NO_GEO',       hard: false, baseline: true,  label: '지역 신호 없음', hint: 'Mairangi·Auckland·NZ 등이 본문에 없다' },
  { key: 'og_fallback',  flag: 'OG_FALLBACK',  hard: false, baseline: true,  label: 'OG 이미지 자동 생성', hint: '대표 사진을 지정하면 공유 카드가 좋아진다' },
  // ── 아래는 W4-A 컬럼이 생긴 뒤의 운영 지표. 기준선(회귀 게이트)에는 넣지 않는다 —
  //    지금 전 편이 미입력이라 게이트로 삼으면 의미가 없고, 채우는 일은 W5 정비 큐의 몫이다.
  { key: 'no_seo_title', flag: 'NO_SEO_TITLE', hard: false, baseline: false, label: 'seo_title 없음', hint: '글 제목이 그대로 검색 제목이 된다' },
  { key: 'no_summary_ko', flag: 'NO_SUMMARY_KO', hard: false, baseline: false, label: '한국어 요약 없음' },
  { key: 'no_faq',       flag: 'NO_FAQ',       hard: false, baseline: false, label: 'FAQ 없음', hint: 'FAQPage 리치 결과 대상이 아니다' },
  { key: 'stale',        flag: 'STALE',        hard: false, baseline: false, label: '90일 이상 미갱신', hint: '오래된 글은 정비 후보다' },
  // 관리자 화면에 원래 있던 위생 검사 — 기준선에는 넣지 않는다(회귀 게이트가 아니라 눈에 띄게 하는 용도).
  { key: 'long_title',   flag: 'LONG_TITLE',   hard: false, baseline: false, label: '검색 제목 60자 초과', hint: '검색 결과에서 잘린다' },
  { key: 'slug_korean',  flag: 'SLUG_KOREAN',  hard: false, baseline: false, label: '슬러그에 한국어' },
  { key: 'no_tags',      flag: 'NO_TAGS',      hard: false, baseline: false, label: '태그 없음' },
  { key: 'stock_image',  flag: 'STOCK_IMAGE',  hard: false, baseline: false, label: '스톡 이미지', hint: 'Unsplash·Picsum — 직접 찍은 사진으로 교체 권장' },
];

export const BASELINE_CHECKS = CHECKS.filter((c) => c.baseline);
export const HARD_FLAGS = CHECKS.filter((c) => c.hard).map((c) => c.flag);
/** 플래그 → 표시용 메타. 화면이 라벨을 따로 적지 않게 한다. */
export const FLAG_META = Object.fromEntries(CHECKS.map((c) => [c.flag, c]));

const count = (s, re) => (s.match(re) ?? []).length;
const GEO_WORDS = ['Mairangi', 'Auckland', 'New Zealand', 'North Shore', 'NZ', 'Aotearoa'];

/** 90일 — "오래됨" 의 기준. 화면과 스크립트가 같은 값을 쓴다. */
export const STALE_DAYS = 90;

/**
 * 글 한 편의 결함 플래그.
 * @param {object} b blogs 행 — content·info_block_html·meta_description·og_image_url 과
 *   (운영 지표용) seo_title·summary_ko·faq_json·updated_at·created_at
 * @param {{ now?: number }} [opts]
 * @returns {string[]}
 */
export function flagsOf(b, opts = {}) {
  const c = b.content ?? '';
  const full = `${c}\n${b.info_block_html ?? ''}`;
  const visible = full.replace(/<[^>]*>/g, ' ');
  const words = c.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const h2 = count(c, /<h2\b/gi);
  const geo = GEO_WORDS.some((k) => new RegExp(`\\b${k}\\b`, 'i').test(visible));

  const flags = [];
  if (count(full, /<h1\b/gi) > 0) flags.push('H1_OVER');
  if (count(full, /<img(?![^>]*\salt=)/gi) > 0) flags.push('ALT_MISSING');
  if (count(full, /href="(\/[^"]+|https?:\/\/(www\.)?mhj\.nz[^"]*)"/gi) === 0) flags.push('ORPHAN');
  if (!b.meta_description) flags.push('META_MISSING');
  if (words < 400) flags.push('THIN');
  if (words >= 400 && h2 < 2) flags.push('NO_H2');
  if (!geo) flags.push('NO_GEO');
  const og = (b.og_image_url ?? '').trim();
  if (!og || isOgApi(og)) flags.push('OG_FALLBACK');

  // ── 운영 지표(기준선 밖) ──
  if (!(b.seo_title ?? '').trim()) flags.push('NO_SEO_TITLE');
  if (!(b.summary_ko ?? '').trim()) flags.push('NO_SUMMARY_KO');
  if (!Array.isArray(b.faq_json) || b.faq_json.length === 0) flags.push('NO_FAQ');
  const stamp = b.updated_at ?? b.created_at;
  const t = stamp ? Date.parse(stamp) : NaN;
  if (!Number.isNaN(t) && (opts.now ?? Date.now()) - t > STALE_DAYS * 24 * 60 * 60 * 1000) flags.push('STALE');

  // 검색 결과에 실제로 나가는 제목 기준(W4-B: seo_title || title)
  if (((b.seo_title ?? '').trim() || b.title || '').length > 60) flags.push('LONG_TITLE');
  if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(b.slug ?? '')) flags.push('SLUG_KOREAN');
  if (!Array.isArray(b.tags) || b.tags.length === 0) flags.push('NO_TAGS');
  if (/unsplash\.com|picsum\.photos/i.test(b.image_url ?? '')) flags.push('STOCK_IMAGE');

  return flags;
}

/** 주간 기준선에 들어가는 플래그만 남긴다 — 운영 지표는 회귀 게이트가 아니다. */
export const baselineFlagsOf = (b, opts) =>
  flagsOf(b, opts).filter((f) => FLAG_META[f]?.baseline);

/** 화면 정렬용 심각도. hard > soft(기준선) > 운영 지표 */
export const severityOf = (flag) => {
  const m = FLAG_META[flag];
  if (!m) return 0;
  return m.hard ? 2 : m.baseline ? 1 : 0;
};
