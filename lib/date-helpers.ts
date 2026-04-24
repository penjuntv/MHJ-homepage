// NZ 남반구 계절 라벨 생성 helper (세션 5 — 편지 sign-off)
// 3-5월: Autumn, 6-8월: Winter, 9-11월: Spring, 12-2월: Summer

export function getNZSeasonLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const m = dateStr.match(/^(\d{4})[.\-/](\d{2})/);
  if (!m) return '';
  const [, year, monthStr] = m;
  const month = parseInt(monthStr, 10);
  let season: string;
  if (month >= 3 && month <= 5) season = 'Autumn';
  else if (month >= 6 && month <= 8) season = 'Winter';
  else if (month >= 9 && month <= 11) season = 'Spring';
  else season = 'Summer';
  return `${year} ${season}`;
}
