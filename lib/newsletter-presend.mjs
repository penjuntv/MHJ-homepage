/**
 * Mairangi Notes 발송 전 점검 — 전체 발송 직전에 서버(`app/api/send-newsletter/route.ts`)가 부른다.
 * 2026-10-16 Cowork 패치(`docs/PATCH-newsletter-presend-gate-2026-10-16.patch`)를 지금 코드에 맞춰 옮겼다.
 *
 * 왜: 발행일 칸 기본값이 "작성 화면을 연 날"이라 28호 중 6호(#4·#17·#18·#21·#27·#29)가 메일 머리에
 * 실제 발송일과 다른 날짜를 찍었다(홈페이지 아카이브는 sent_at 을 보여 줘 둘이 어긋난다). 테스트 메일 없이도,
 * 테스트 메일을 본 뒤 고쳐도 그대로 전체 발송이 됐다.
 *
 * `.mjs` 인 이유: 작성 화면(TSX)·발송 API·node 테스트(`scripts/qa/test-newsletter-presend.mjs`)가 같은 코드를
 * 쓰기 위해서다(`lib/search-title.mjs` 와 같은 선례). 해시 계산(node:crypto)은 여기 두지 않는다 — 작성 화면이
 * 이 파일을 브라우저로 가져간다.
 */

const NZ_TZ = 'Pacific/Auckland';

/** @param {number} n */
const pad2 = (n) => String(n).padStart(2, '0');

/**
 * 그 순간의 뉴질랜드 날짜 — 메일 머리 표기와 같은 "YYYY.MM.DD".
 * @param {Date} [d]
 * @returns {string}
 */
export function nzDateString(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: NZ_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const get = (/** @type {string} */ t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}.${get('month')}.${get('day')}`;
}

/**
 * 다가오는 금요일(뉴질랜드 날짜, 오늘이 금요일이면 오늘) — 작성 화면 발행일 칸의 기본값.
 * Mairangi Notes 는 금요일에 나간다(28호 중 대부분).
 * @param {Date} [d]
 * @returns {string}
 */
export function upcomingFridayNz(d = new Date()) {
  const [y, m, day] = nzDateString(d).split('.').map(Number);
  const base = new Date(Date.UTC(y, m - 1, day));
  base.setUTCDate(base.getUTCDate() + ((5 - base.getUTCDay() + 7) % 7));
  return `${base.getUTCFullYear()}.${pad2(base.getUTCMonth() + 1)}.${pad2(base.getUTCDate())}`;
}

/** 이보다 짧은 프리헤더는 빈칸이거나 임시값(':)' 등)으로 본다. */
export const PREHEADER_MIN = 5;

/**
 * 전체 발송을 막을 사유 목록. 빈 배열이면 보내도 된다.
 *
 * @param {{ issueDate?: string; preheader?: string; locals?: Array<{ title?: string; body?: string; link?: string }> }} data
 *   발송할 메일 데이터(MailrangiNotesData 의 일부)
 * @param {{ now?: Date; renderedHash: string; approvedHash?: string }} opts
 *   renderedHash = 지금 발송할 본문의 해시 · approvedHash = 편집자가 테스트 메일로 확인한 본문의 해시
 * @returns {string[]}
 */
export function presendIssues(data, opts) {
  const issues = [];
  const today = nzDateString(opts.now);
  const issueDate = (data.issueDate ?? '').trim();
  if (issueDate !== today) {
    issues.push(`발행일 "${issueDate || '(빈칸)'}" 이 오늘 뉴질랜드 날짜 ${today} 와 다릅니다. 발행일을 고치고 테스트 메일을 다시 보내 확인하세요.`);
  }
  const preheader = (data.preheader ?? '').trim();
  if (preheader.length < PREHEADER_MIN) {
    issues.push(`프리헤더(받은편지함 미리보기 문구)가 비었거나 임시값("${preheader}")입니다.`);
  }
  (data.locals ?? []).forEach((c, i) => {
    const t = (c.title ?? '').trim();
    const b = (c.body ?? '').trim();
    const l = (c.link ?? '').trim();
    if (!t && !b && !l) issues.push(`Local Guide ${i + 1}번 칸이 비어 있습니다(빈 칸이 메일에 그대로 나갑니다). 채우거나 칸을 끄세요.`);
    else if (!t || !b) issues.push(`Local Guide ${i + 1}번에 제목 또는 본문이 없습니다.`);
  });
  if (!opts.approvedHash) {
    issues.push('테스트 메일 확인이 없습니다. 먼저 테스트 메일을 보내 최종본을 확인하세요.');
  } else if (opts.approvedHash !== opts.renderedHash) {
    issues.push('테스트 메일을 보낸 뒤 내용이 바뀌었습니다. 테스트 메일을 다시 보내 확인하세요.');
  }
  return issues;
}
