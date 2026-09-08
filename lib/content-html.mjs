/**
 * 블로그 본문 HTML 순수 변환 — 서버 렌더 직전에만 쓴다(DB 원본은 고치지 않는다).
 *
 * `.mjs` 인 이유: 앱(TSX)과 node 테스트(`scripts/qa/test-content-html.mjs`)가 **같은 코드**를 쓰기 위해서다
 * (`lib/magazine-clip.mjs`·`lib/image-proxy-allow.mjs` 와 같은 선례).
 *
 * 이미지 최적화는 `lib/image-url.ts` 의 `optimizeContentImages` 가 담당한다 — 합성 순서는
 * optimizeContentImages → addHeadingIds → wrapKeyTakeaways (호출부: app/(public)/blog/[slug]/page.tsx).
 */

/** 태그·엔티티를 걷어내고 공백을 정리한 평문. 발췌·단어 수·제목 텍스트의 공통 입력. */
export function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 읽는 시간(분). 영어 기준 200 wpm — 사이트 정본이 영어다(D1).
 * 0분은 만들지 않는다: 아주 짧은 글도 "1 min read".
 */
export function readingMinutes(html, wordsPerMinute = 200) {
  const text = stripHtml(html);
  if (!text) return 1;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

/** 제목 텍스트 → 앵커 id. 한글도 살린다(유니코드 letter/number 유지). */
export function slugifyHeading(text) {
  const base = String(text ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return base || 'section';
}

/**
 * 본문 `<h2>` 에 앵커 id 를 달고 목차 목록을 함께 돌려준다.
 * 목차와 앵커가 **같은 통과에서** 만들어지므로 서로 어긋날 수 없다.
 * 이미 id 가 있으면 그대로 두고 목록에만 넣는다.
 * @returns {{ html: string, headings: { id: string, text: string }[] }}
 */
export function addHeadingIds(html) {
  /** @type {{ id: string, text: string }[]} */
  const headings = [];
  if (!html) return { html: '', headings };
  const HEADING = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
  // `data-id` 를 id 로 오인하지 않도록 속성 경계를 요구하고, 작은따옴표도 받는다.
  const idOf = (attrs) => {
    const m = attrs.match(/(?:^|\s)id\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    return m ? (m[1] ?? m[2]) : undefined;
  };
  // 1단계: 저자가 직접 쓴 id 를 먼저 예약한다. 자동 id 가 뒤에 나올 저자 id 를 선점하면
  // 문서에 같은 id 가 두 번 생기고 목차 두 항목이 같은 자리로 점프한다.
  const used = new Map();
  for (const [, attrs] of String(html).matchAll(HEADING)) {
    const existing = idOf(attrs);
    if (existing) used.set(existing, (used.get(existing) ?? 0) + 1);
  }
  // 2단계: 남은 제목에 id 를 부여한다.
  const out = String(html).replace(HEADING, (tag, attrs, inner) => {
    const text = stripHtml(inner);
    if (!text) return tag; // 빈 제목은 앵커도 목차도 만들지 않는다
    const existing = idOf(attrs);
    let id = existing || slugifyHeading(text);
    if (!existing) {
      let n = 1;
      while (used.has(id)) { n += 1; id = `${slugifyHeading(text)}-${n}`; }
      used.set(id, 1);
    }
    // takeaways 라벨은 본문의 절(節)이 아니라 박스 제목이다(wrapKeyTakeaways 가 aside 안으로 넣는다).
    // 목차에 넣으면 "요약" 으로 점프하는 항목이 생기고 3개 기준도 흔들린다.
    if (!isTakeawaysHeading(text)) headings.push({ id, text });
    return existing ? `<h2${attrs}>${inner}</h2>` : `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return { html: out, headings };
}

/** "Key takeaways" 제목으로 인정하는 문구 (사용자 결정 2026-09-09: takeaways 는 본문 HTML 관례) */
const TAKEAWAYS_HEADING = /^(key\s*takeaways?|takeaways?|핵심\s*요약|한\s*줄\s*요약)\s*[:：.]?$/i;

/** 제목 텍스트가 takeaways 라벨인가 — 목차 제외와 박스 감싸기가 같은 규칙을 쓴다. */
export const isTakeawaysHeading = (text) => TAKEAWAYS_HEADING.test(stripHtml(text));

/**
 * `<h2|h3>Key takeaways</h2>` + 바로 뒤 `<ul>` 을 `<aside class="blog-takeaways">` 로 감싼다.
 * 못 찾으면 원본 그대로 — 기존 84편(2026-09-08 실측 `<ul>` 보유 0편)에 영향이 없다.
 * 한계: 중첩 `<ul>` 은 첫 `</ul>` 에서 끊긴다. takeaways 는 평면 3~5줄 규격이라 허용한다.
 */
export function wrapKeyTakeaways(html) {
  if (!html) return '';
  return String(html).replace(
    /(<h([23])\b[^>]*>([\s\S]*?)<\/h\2>)(\s*)(<ul\b[^>]*>[\s\S]*?<\/ul>)/gi,
    (whole, heading, _level, inner, _gap, list) => {
      if (!isTakeawaysHeading(inner)) return whole;
      // 중첩 목록이면 정규식이 첫 </ul> 에서 끊어 <aside> 가 <li> 안에서 닫힌다 —
      // 브라우저가 마크업을 재구성해 뒤 항목이 박스 밖으로 튀어나간다. 그럴 바엔 감싸지 않는다.
      if (/<(ul|ol)\b/i.test(list.slice(list.indexOf('>') + 1))) return whole;
      return `<aside class="blog-takeaways">${heading}${list}</aside>`;
    },
  );
}

/**
 * faq_json 방어 필터 — DB CHECK(blogs_faq_json_shape)가 있어도 렌더러가 한 번 더 본다.
 * 잘못된 원소 하나로 서버 컴포넌트가 죽어 글 전체가 500 이 되는 편보다, 그 원소만 빠지는 편이 낫다.
 * @returns {{ q: string, a: string }[]}
 */
export function sanitizeFaq(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (it) =>
        it && typeof it === 'object' &&
        typeof it.q === 'string' && typeof it.a === 'string' &&
        it.q.trim() !== '' && it.a.trim() !== '',
    )
    .map((it) => ({ q: it.q.trim(), a: it.a.trim() }));
}

/**
 * 평문(summary_ko 등)을 문단 배열로. 빈 줄이 문단 경계다.
 * HTML 로 취급하지 않으므로 렌더러는 dangerouslySetInnerHTML 없이 그대로 출력한다.
 * @returns {string[]}
 */
export function toParagraphs(text) {
  if (!text) return [];
  return String(text)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}
