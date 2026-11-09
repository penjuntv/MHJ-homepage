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

/** 서랍 3편 한 칸 — 어디서 왔는지(편집자 선택 / 같은 서랍 자동)를 클릭 기록에 남긴다. */
export type DrawerPick = ContinuePost & { source: 'editor' | 'drawer' };

interface Props {
  category: string;
  next: ContinuePost | null;
  /** 서랍의 가장 새 글이면 다음 글 대신 바로 앞 글이 온다 — 꼬리표를 바꾼다. */
  nextIsEarlier: boolean;
  picks: DrawerPick[];
}

/**
 * 글 끝 이어 읽기(계획서 2026-11 §4 3단계 · 옛 묶음 C, 2026-11-09 PeNnY 합의 A안).
 * 본문 바로 뒤에 "다음 글 1편 + 같은 서랍 3편"을 한 묶음으로 둔다. 구독 한 줄은 이 묶음 바로 뒤(page.tsx).
 * 예전 자리(댓글 뒤 이전·다음 사진 카드, 맨 끝 You Might Also Like 띠)는 60일 클릭 0 이었다 — 본문 끝까지 온
 * 81세션에게도 화면 3~5장 아래였다.
 *
 * 카드에는 날짜·저자를 넣지 않는다(DESIGN_RULES §10.2). 서랍 이름은 지금 글과 다른 서랍일 때만 붙인다.
 */
export default function ContinueReading({ category, next, nextIsEarlier, picks }: Props) {
  if (!next && picks.length === 0) return null;

  const hub = categoryHref(category);
  const anySameDrawer = picks.some((p) => p.category === category);

  return (
    <section className="post-continue" aria-labelledby="post-continue-heading">
      <h2 id="post-continue-heading" className="post-continue-heading">Keep reading</h2>

      {next && (
        <Link
          href={`/blog/${next.slug}`}
          className="post-continue-next"
          data-track="next_read_click"
          data-track-location="post_end"
          data-track-direction={nextIsEarlier ? 'earlier_in_drawer' : 'next_in_drawer'}
          data-track-slug={next.slug}
        >
          <span className="post-continue-next-image">
            {/* 사진은 장식 — 제목이 링크 이름이다(같은 말을 두 번 읽지 않게). */}
            <SafeImage
              src={next.image_url || '/placeholder.svg'}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 280px"
              className="object-cover"
            />
          </span>
          <span className="post-continue-next-text">
            <span className="post-continue-label">
              {nextIsEarlier ? 'Earlier' : 'Next'} in {category}
            </span>
            <span className="post-continue-next-title font-display">{next.title}</span>
          </span>
        </Link>
      )}

      {picks.length > 0 && (
        <div className="post-continue-more">
          <div className="post-continue-more-head">
            <h3 className="post-continue-more-title font-display">
              {anySameDrawer ? `More from ${category}` : 'More stories'}
            </h3>
            {/* 서랍에 이 글 하나뿐이면(다음 글도 서랍 글도 없음) 허브는 지금 글로 되돌아올 뿐이다 — 숨긴다. */}
            {hub !== '/blog' && (next || anySameDrawer) && (
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
                    <SafeImage
                      src={p.image_url || '/placeholder.svg'}
                      alt=""
                      fill
                      sizes="112px"
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
        </div>
      )}
    </section>
  );
}
