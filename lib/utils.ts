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

// stagger 인덱스: 최대 4
export function staggerIndex(i: number): number {
  return Math.min(i + 1, 4);
}
