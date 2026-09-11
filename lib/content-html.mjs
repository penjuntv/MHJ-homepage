/**
 * 블로그 본문 HTML 순수 변환 — 서버 렌더 직전에만 쓴다(DB 원본은 고치지 않는다).
 *
 * `.mjs` 인 이유: 앱(TSX)과 node 테스트(`scripts/qa/test-content-html.mjs`)가 **같은 코드**를 쓰기 위해서다
 * (`lib/magazine-clip.mjs`·`lib/image-proxy-allow.mjs` 와 같은 선례).
 *
 * 이미지 최적화는 `lib/image-url.ts` 의 `optimizeContentImages` 가 담당한다 — 합성 순서는
 * optimizeContentImages → addHeadingIds → wrapKeyTakeaways → splitForMidInsert(마지막, 선택)
 * (호출부: app/(public)/blog/[slug]/page.tsx).
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
 * 상대경로 링크·이미지를 절대 URL 로. 피드·LLM 인덱스처럼 **사이트 밖에서 읽히는 사본**에 쓴다.
 * 리더 안에서 `/blog/x` 는 리더의 도메인으로 풀려 깨진다.
 * 지금 라이브 본문에는 상대경로가 0건이지만, W4-C 폼이 내부 링크(`/blog/…`)를 권하므로 곧 생긴다.
 */
export function absolutizeUrls(html, baseUrl) {
  if (!html) return '';
  const base = String(baseUrl ?? '').replace(/\/$/, '');
  return String(html).replace(
    /\b(href|src)\s*=\s*(["'])(\/[^"']*)\2/gi,
    // `//cdn...` 는 프로토콜 상대 URL 이라 손대지 않는다.
    (whole, attr, quote, path) => (path.startsWith('//') ? whole : `${attr}=${quote}${base}${path}${quote}`),
  );
}

/**
 * XML 1.0 이 허용하지 않는 문자를 뺀다. CDATA 안이라도 파서는 문서 전체를 거부한다 —
 * 항목 하나가 아니라 **피드 전체**가 리더에서 사라진다.
 * 워드·구글독스에서 붙여넣으면 VT(\x0B)·FF(\x0C) 가 섞여 들어온다.
 */
export function stripXmlIllegal(text) {
  return String(text ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\uFFFE\uFFFF]/g, '');
}

/** 확장자 → MIME. RSS enclosure 의 type 은 실제 파일과 맞아야 한다(지금은 전부 image/jpeg 로 나간다). */
export function imageMimeOf(url) {
  const ext = String(url ?? '').split('?')[0].split('.').pop()?.toLowerCase();
  return { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' }[ext] ?? null;
}

/**
 * 본문 HTML → 마크다운. AI 답변 엔진이 읽는 사본(llms-full.txt)용이라 구조(제목·목록·링크)를 남긴다.
 * 완전한 변환기가 아니다 — 이 사이트 본문이 쓰는 태그만 다룬다.
 */
export function htmlToMarkdown(html, baseUrl = '', { headingOffset = 0 } = {}) {
  if (!html) return '';
  let out = absolutizeUrls(String(html), baseUrl);
  out = out
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    // 링크를 **먼저** 마크다운으로 바꾼다. 제목·목록·인용 처리기가 stripHtml 로 안쪽을 평문화하므로
    // 나중에 돌리면 그 안의 링크는 URL 을 잃는다(라이브 1건에서 실제로 잃고 있었다).
    .replace(/<a\b[^>]*\bhref\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, inner) => {
      const text = stripHtml(inner);
      return text ? `[${text}](${href})` : '';
    })
    .replace(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/gi, '\n_$1_\n')
    // 이미지는 alt 만 남긴다 — 본문 밖 사본에서 src 는 무게만 늘리고 인용에 쓰이지 않는다.
    // 앞뒤로 빈 줄을 둬야 다음 문단과 한 덩어리로 붙지 않는다.
    .replace(/<img\b[^>]*\balt\s*=\s*"([^"]*)"[^>]*>/gi, (m, alt) => (alt.trim() ? `\n\n![${alt.trim()}]()\n\n` : '\n\n'))
    .replace(/<img\b[^>]*>/gi, '\n\n')
    // headingOffset: 문서 안에 끼워 넣을 때 본문 제목이 바깥 구조(##)를 밀어내지 않게 한 단계 낮춘다.
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (m, level, inner) =>
      `\n\n${'#'.repeat(Math.min(6, Number(level) + headingOffset))} ${stripHtmlKeepLinks(inner)}\n\n`)
    // 번호 목록은 번호로 — `<ol>` 을 불릿으로 내면 순서가 뜻이던 목록이 뜻을 잃는다.
    .replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (m, inner) => {
      let i = 0;
      return `\n${inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (mm, li) => { i += 1; return `\n${i}. ${stripHtmlKeepLinks(li)}`; })}\n\n`;
    })
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (m, inner) => `\n- ${stripHtmlKeepLinks(inner)}`)
    // 목록이 끝나면 빈 줄 — 없으면 다음 문단이 마지막 항목의 이어쓰기로 붙는다.
    .replace(/<\/(ul|ol)>/gi, '\n\n')
    .replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (m, inner) => `\n\n> ${stripHtmlKeepLinks(inner)}\n\n`)
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (m, tag, inner) => `**${stripHtml(inner)}**`)
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (m, tag, inner) => `_${stripHtml(inner)}_`)
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n');
  // 남은 태그를 걷어내고 공백을 정리한다. 문단 경계(빈 줄)는 지킨다.
  return stripHtml_keepBreaks(out).replace(/\n{3,}/g, '\n\n').trim();
}

/** 태그는 걷어내되 이미 마크다운으로 바뀐 링크 표기는 살린다(위에서 <a> 를 먼저 처리했다). */
function stripHtmlKeepLinks(inner) {
  return String(inner).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** stripHtml 과 같지만 줄바꿈을 보존한다(마크다운 변환 마무리용). */
function stripHtml_keepBreaks(text) {
  return String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n');
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

// ── 본문 중간 삽입 지점 ─────────────────────────────────────────────────────────

/** 자식 없이 스스로 끝나는 요소. 나머지는 모두 여는/닫는 태그로 깊이를 센다. */
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** 따옴표 안의 `>` 까지 견디는 태그 패턴(주석은 따로 건너뛴다). */
const TAG_RE = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/g;

/**
 * 본문 중간에 무언가(구독 CTA)를 끼울 **안전한 지점**에서 둘로 가른다 → `[앞, 뒤]` 또는 `null`.
 *
 * `</p>` 로 단순히 쪼개면 인용·목록·표·Key takeaways 박스 **안에서** 잘린다(발행 80편 중 19편이 그런 블록을 가진다) —
 * 반쯤 열린 태그를 브라우저가 멋대로 닫아 레이아웃이 무너진다. 그래서 태그 깊이를 세어 **최상위 자식 사이**에서만 자른다.
 *
 * 규칙: 글자가 있는 최상위 `<p>` 가 `minParagraphs` 개 이상 · 경계 **양옆이 모두 그런 `<p>`**(제목과 그 본문 사이,
 * 박스·그림 직후를 끊지 않는다) · 앞뒤 각 `minEachSide` 개 이상 · 그중 글자 수 50% 에 가장 가까운 곳.
 * 그 지점이 글자 수 **30~70%(`window`) 밖**이면 역시 `null` — 발행 81편 실측에서 최선의 경계가 16%(리드를 끊는다)나
 * 96%(사실상 끝)인 글이 있었다. 한쪽 끝으로 몰린 자리는 '본문 중간'이 아니다.
 * 조건을 못 채우면 `null`(호출부가 끝에 둔다). 짝이 안 맞는 HTML 도 `null` — 망가진 입력을 더 망가뜨리지 않는다.
 * 돌려주는 두 조각은 항상 `앞 + 뒤 === 원문` 이다.
 */
export function splitForMidInsert(html, { minParagraphs = 5, minEachSide = 2, window = [0.3, 0.7] } = {}) {
  if (!html) return null;
  const src = String(html);
  const blocks = [];
  let depth = 0;
  let openAt = -1;
  let openTag = '';
  TAG_RE.lastIndex = 0;
  let m;
  while ((m = TAG_RE.exec(src))) {
    if (m[0].startsWith('<!--')) continue;
    const tag = m[2].toLowerCase();
    if (m[1] === '/') {
      depth -= 1;
      if (depth < 0) return null;
      if (depth === 0) blocks.push({ start: openAt, end: TAG_RE.lastIndex, tag: openTag });
      continue;
    }
    if (VOID_TAGS.has(tag) || m[0].endsWith('/>')) {
      if (depth === 0) blocks.push({ start: m.index, end: TAG_RE.lastIndex, tag });
      continue;
    }
    if (depth === 0) { openAt = m.index; openTag = tag; }
    depth += 1;
  }
  if (depth !== 0 || blocks.length < 2) return null;

  const text = blocks.map((b) => stripHtml(src.slice(b.start, b.end)).length);
  const isPara = blocks.map((b, i) => b.tag === 'p' && text[i] > 0);
  const parasTotal = isPara.filter(Boolean).length;
  if (parasTotal < minParagraphs) return null;

  const total = text.reduce((a, n) => a + n, 0);
  let before = 0;
  let parasBefore = 0;
  let best = null;
  for (let i = 0; i < blocks.length - 1; i += 1) {
    before += text[i];
    if (isPara[i]) parasBefore += 1;
    if (!isPara[i] || !isPara[i + 1]) continue;
    // 두 블록 사이에 최상위 글자(텍스트 노드)가 끼어 있으면 그 자리는 경계가 아니다.
    if (src.slice(blocks[i].end, blocks[i + 1].start).trim()) continue;
    if (parasBefore < minEachSide || parasTotal - parasBefore < minEachSide) continue;
    const ratio = before / total;
    if (ratio < window[0] || ratio > window[1]) continue;
    const gap = Math.abs(ratio - 0.5);
    if (!best || gap < best.gap) best = { at: blocks[i].end, gap };
  }
  if (!best) return null;
  return [src.slice(0, best.at), src.slice(best.at)];
}

