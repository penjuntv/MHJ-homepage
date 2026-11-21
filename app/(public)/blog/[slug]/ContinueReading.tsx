import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { categoryHref } from '@/lib/constants';

/** `BLOG_RELATED_COLUMNS` 로 읽은 글 한 편 — 이 블록이 실제로 쓰는 칸만. */
export type ContinuePost = {
  id: number;
  title: string;
  slug: string;
  image_url: string | null;
  category: string;
  date: string;
};

/** Read More 한 칸 — 어디서 왔는지(유씨 선택 / 다음 글 / 같은 카테고리 최신)를 클릭 기록에 남긴다. */
export type ReadMorePick = ContinuePost & { source: 'editor' | 'next' | 'drawer' };

interface Props {
  category: string;
  picks: ReadMorePick[];
}

/**
 * 글 끝 Read More — 같은 크기 박스 2편(2026-11-22 PeNnY·유씨 결정, 고르기 순서는 lib/read-more-picks.mjs).
 * 예전 "Keep reading"(자동 다음 글 큰 카드 1 + More from 3줄, 2026-11-09)을 합쳤다 — 추천이 4편이라 많았다.
 * 휴대폰은 [사진 | 제목 2줄] 가로 박스 두 줄, 넓은 화면은 두 칸 나란히.
 * 구독 한 줄은 이 묶음 바로 뒤(page.tsx). 카드에는 날짜·저자를 넣지 않는다(DESIGN_RULES §10.2).
 */
export default function ContinueReading({ category, picks }: Props) {
  if (picks.length === 0) return null;

  const hub = categoryHref(category);
  const anySameDrawer = picks.some((p) => p.category === category);

  return (
    <section className="post-continue" aria-labelledby="post-continue-heading">
      <div className="post-continue-head">
        <h2 id="post-continue-heading" className="post-continue-heading font-display">Read More</h2>
        {/* 카테고리 허브로 가는 작은 길 — 이 카테고리 글이 하나도 안 걸렸으면(지금 글뿐) 숨긴다. */}
        {hub !== '/blog' && anySameDrawer && (
          <Link href={hub} className="post-continue-hub" data-track="drawer_click" data-track-location="post_end" data-track-category={category}>
            All {category} stories →
          </Link>
        )}
      </div>
      <ol className="post-continue-list">
        {picks.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/blog/${p.slug}`}
              className="post-continue-item"
              data-track="related_click"
              data-track-location="post_end"
              data-track-source={p.source}
              data-track-slug={p.slug}
              data-track-position={String(i + 1)}
            >
              <span className="post-continue-thumb">
                {/* 사진은 장식 — 제목이 링크 이름이다(같은 말을 두 번 읽지 않게). */}
                <SafeImage
                  src={p.image_url || '/placeholder.svg'}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 88px, 120px"
                  className="object-cover"
                />
              </span>
              <span className="post-continue-item-text">
                {p.category !== category && <span className="post-continue-item-cat">{p.category}</span>}
                <span className="post-continue-item-title">{p.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
