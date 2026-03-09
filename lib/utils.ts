// 슬러그 생성: 한글 + 영문 텍스트 → URL-safe 슬러그
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// 날짜 포맷: ISO → '2026.03.08'
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

// stagger 인덱스: 최대 4
export function staggerIndex(i: number): number {
  return Math.min(i + 1, 4);
}
