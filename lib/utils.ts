// 슬러그 생성: 한글 + 영문 텍스트 → URL-safe 슬러그
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// 날짜 포맷: '2026.03.08.' 또는 ISO → '8 Mar 2026'
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  // "YYYY.MM.DD." or "YYYY.MM.DD"
  const dot = dateString.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (dot) return `${parseInt(dot[3])} ${MONTHS[parseInt(dot[2]) - 1]} ${dot[1]}`;
  // "YYYY-MM-DD" or ISO
  const iso = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${parseInt(iso[3])} ${MONTHS[parseInt(iso[2]) - 1]} ${iso[1]}`;
  return dateString;
}

/**
 * timestamptz(ISO) 를 **뉴질랜드 달력 날짜**로. `formatDate` 는 문자열을 그대로 잘라 쓰므로
 * UTC 자정 부근에 저장된 시각(예: 2026-09-05T22:00Z = 6 Sep NZ)을 하루 앞으로 보여준다.
 * 발행일(`blogs.date`)은 이미 NZ 기준 표기라, 갱신일도 같은 기준이어야 "발행 5 Sep · 수정 5 Sep" 같은
 * 모순이 생기지 않는다.
 */
export function formatNZDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // 월 이름은 로케일에 맡기지 않는다 — en-NZ 는 'Sept' 를 내서 formatDate('Sep')와 문자열이 달라지고,
  // "발행일과 같은 날이면 숨긴다" 판정이 영원히 참이 된다. 숫자만 시간대로 얻고 표기는 MONTHS 로 맞춘다.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Auckland', day: 'numeric', month: 'numeric', year: 'numeric',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const month = MONTHS[parseInt(get('month')) - 1];
  if (!month) return '';
  return `${parseInt(get('day'))} ${month} ${get('year')}`;
}

// stagger 인덱스: 최대 4
export function staggerIndex(i: number): number {
  return Math.min(i + 1, 4);
}
