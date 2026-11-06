import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { bulkCategoryRevalidatePaths, parseCategoryMoves } from '@/lib/bulk-category';
import { DERIVED_PATHS, DERIVED_SEGMENTS } from '@/lib/revalidate-targets';

/* ── 관리자: 저널 글 카테고리 일괄 변경 (2026-11-06) ──
   인증은 middleware.ts matcher(관리자 이메일 + MFA)가 건다 — 여기까지 왔으면 관리자다.
   본문 `{ items: [{ id, category }] }`. 되돌리기도 같은 API 에 글마다 원래 카테고리를 실어 보낸다.

   응답의 `changed[].from` 이 되돌리기 재료다. 이미 그 카테고리인 글은 건드리지 않고 `unchanged` 로 돌려준다.
   바뀐 글이 있으면 그 자리에서 공개 캐시를 갱신한다(홈·/blog·각 글·옛/새 허브 + 허브 쪽 주소 세그먼트) —
   브라우저가 따로 /api/revalidate 를 부르다 끊겨 허브가 1시간 낡는 일이 없게. */

interface Row { id: number; slug: string | null; category: string; published: boolean | null }

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: '요청 본문이 JSON 이 아닙니다.' }, { status: 400 }); }

  const moves = parseCategoryMoves(body);
  if (typeof moves === 'string') return NextResponse.json({ message: moves }, { status: 400 });

  const db = createAdminClient();
  const ids = moves.map(m => m.id);
  const { data: rows, error: readError } = await db
    .from('blogs').select('id, slug, category, published').in('id', ids);
  if (readError) return NextResponse.json({ message: `글을 읽지 못했습니다: ${readError.message}` }, { status: 500 });

  const byId = new Map((rows as Row[]).map(r => [r.id, r]));
  const notFound = ids.filter(id => !byId.has(id));
  const unchanged: number[] = [];
  // (옛 카테고리, 새 카테고리) 쌍 → 옮길 글. UPDATE 에 옛 카테고리를 조건으로 걸어, 읽은 뒤 다른 저장이 먼저 바꾼 글은
  // 덮어쓰지 않는다 — 덮어쓰면 응답의 `from`(되돌리기 재료)이 틀린 값이 된다.
  const groups = new Map<string, { from: string; to: string; rows: Row[] }>();

  for (const m of moves) {
    const row = byId.get(m.id);
    if (!row) continue;
    if (row.category === m.category) { unchanged.push(m.id); continue; }
    const key = `${row.category}\u0000${m.category}`;
    const g = groups.get(key) ?? { from: row.category, to: m.category, rows: [] };
    g.rows.push(row);
    groups.set(key, g);
  }

  const changed: Array<{ id: number; slug: string | null; from: string; to: string }> = [];
  const failed: Array<{ ids: number[]; to: string; message: string }> = [];
  let touchesPublic = false;

  for (const { from, to, rows: group } of groups.values()) {
    const groupIds = group.map(r => r.id);
    const { data: done, error } = await db
      .from('blogs').update({ category: to }).in('id', groupIds).eq('category', from).select('id');
    if (error) { failed.push({ ids: groupIds, to, message: error.message }); continue; }
    const doneIds = new Set((done ?? []).map(d => d.id as number));
    for (const r of group) {
      if (!doneIds.has(r.id)) { failed.push({ ids: [r.id], to, message: '그사이 다른 곳에서 카테고리가 바뀌어 건너뜀 — 새로고침 후 다시 시도' }); continue; }
      changed.push({ id: r.id, slug: r.slug, from: r.category, to });
      if (r.published) touchesPublic = true;
    }
  }

  let revalidated: string[] = [];
  // 초안만 옮겼으면 공개 화면은 그대로다 — 캐시를 건드리지 않는다. (예약 글은 published=true 라 갱신 대상)
  if (touchesPublic) {
    try {
      revalidated = bulkCategoryRevalidatePaths(changed.filter(c => byId.get(c.id)?.published));
      for (const p of revalidated) revalidatePath(p);
      // 허브 2쪽 이후(/blog/category/{slug}/page/{n})·/blog/page/{n} 은 몇 쪽까지 있는지 몰라 세그먼트로 통째.
      for (const seg of DERIVED_SEGMENTS) revalidatePath(seg, 'page');
      // 카테고리가 실린 sitemap·feed·llms 도 낡는다.
      for (const p of DERIVED_PATHS) revalidatePath(p);
      revalidateTag('blogs');
    } catch {
      // 캐시 갱신이 실패해도 DB 변경은 끝났다 — 화면에 알려 수동 갱신을 하게 한다.
      return NextResponse.json({ changed, unchanged, notFound, failed, revalidated: [], revalidateError: true });
    }
  }

  return NextResponse.json({ changed, unchanged, notFound, failed, revalidated });
}
