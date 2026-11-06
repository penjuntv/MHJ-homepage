/**
 * 관리자 「카테고리 일괄 변경」의 순수 로직 — 요청 검증과 캐시 갱신 경로 계산(2026-11-06).
 * DB·Next 를 부르지 않아 라우트(`app/api/blogs/bulk-category`) 밖에서도 그대로 시험할 수 있다.
 *
 * 요청은 `{ items: [{ id, category }] }` — 한 번에 모두 같은 카테고리로 옮길 때도, 되돌리기처럼 글마다 원래 카테고리로
 * 돌려놓을 때도 같은 모양이다. 카테고리는 `BLOG_CATEGORIES` 7개만 받는다(DB 의 `blogs_category_check` 와 같은 목록).
 */
import { BLOG_CATEGORIES, CATEGORY_TO_SLUG, type BlogCategory } from './constants';

/** 한 번에 옮길 수 있는 최대 편수 — 전체 글(약 100편)을 한 번에 고를 수 있을 만큼, 실수로 무한히 커지지 않을 만큼. */
export const BULK_CATEGORY_MAX = 500;

export interface CategoryMove { id: number; category: BlogCategory }

export function isBlogCategory(value: unknown): value is BlogCategory {
  return typeof value === 'string' && (BLOG_CATEGORIES as readonly string[]).includes(value);
}

/** 요청 본문 → 옮길 목록. 잘못되면 사람이 읽을 이유(문자열)를 돌려준다. 같은 id 가 두 번 오면 거부한다(어느 쪽이 맞는지 모름). */
export function parseCategoryMoves(body: unknown): CategoryMove[] | string {
  const items = (body as { items?: unknown } | null)?.items;
  if (!Array.isArray(items) || items.length === 0) return '옮길 글이 없습니다.';
  if (items.length > BULK_CATEGORY_MAX) return `한 번에 ${BULK_CATEGORY_MAX}편까지만 옮길 수 있습니다.`;

  const seen = new Set<number>();
  const moves: CategoryMove[] = [];
  for (const raw of items) {
    const id = (raw as { id?: unknown } | null)?.id;
    const category = (raw as { category?: unknown } | null)?.category;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return '글 번호가 올바르지 않습니다.';
    if (!isBlogCategory(category)) return `허용되지 않은 카테고리입니다: ${String(category)}`;
    if (seen.has(id)) return `같은 글(${id})이 두 번 들어 있습니다.`;
    seen.add(id);
    moves.push({ id, category });
  }
  return moves;
}

/** 옮긴 글들 → 다시 그릴 공개 경로. 홈·블로그 목록·각 글·옛/새 카테고리 허브 첫 쪽. 허브 2쪽 이후는 라우트가 세그먼트로 통째 갱신. */
export function bulkCategoryRevalidatePaths(
  changed: ReadonlyArray<{ slug: string | null; from: string; to: string }>,
): string[] {
  const paths = new Set<string>(['/', '/blog']);
  for (const c of changed) {
    if (c.slug) paths.add(`/blog/${c.slug}`);
    for (const cat of [c.from, c.to]) {
      const slug = CATEGORY_TO_SLUG[cat as BlogCategory];
      if (slug) paths.add(`/blog/category/${slug}`);
    }
  }
  return [...paths];
}
