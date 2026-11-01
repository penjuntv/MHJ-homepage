import Link from 'next/link';
import { getMostReadBlogsCached } from '@/app/(public)/blog/_lib/blog-list-data';
import NotFoundSearch from '@/components/NotFoundSearch';

/**
 * 404 본문 — 루트(`app/not-found.tsx`, 미매칭 URL)와 `(public)/not-found.tsx`(앱 안의 notFound())가 같이 쓴다.
 * 오타·옛 링크로 들어온 사람이 **여기서 끝나지 않게** 검색칸과 많이 읽힌 글 3편을 둔다(2026-09-11 W6-C).
 * 링크·검색에 `data-track` 을 달아 깨진 링크로 들어온 사람이 어디로 빠져나가는지 잰다.
 */
export default async function NotFoundContent() {
  // /blog 의 "Most Read" 와 같은 조회·같은 캐시(태그 'blogs', 300초). 루트 404 는 빌드 때 정적으로 굳는다 —
  // 캐시 태그가 붙어 있어야 발행 시 revalidateTag('blogs') 로 함께 갱신되고, 내려간 글을 계속 권하지 않는다.
  const popular = (await getMostReadBlogsCached()).slice(0, 3);

  return (
    <>
      <p
        className="font-display"
        style={{ fontSize: 'clamp(72px, 14vw, 128px)', lineHeight: 1, fontStyle: 'italic', color: 'var(--text-tertiary)', margin: 0 }}
      >
        404
      </p>
      <h1 className="font-display" style={{ fontSize: 'clamp(24px, 4vw, 32px)', color: 'var(--text)', margin: 0 }}>
        We can’t find that page
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, maxWidth: '420px', margin: 0 }}>
        It may have moved, or it no longer exists.
        <br />
        Search for the story you were after, or start again with a reader favourite.
      </p>

      <NotFoundSearch />

      {popular.length > 0 && (
        <section aria-labelledby="nf-popular" style={{ width: '100%', maxWidth: 420, marginTop: 8, textAlign: 'left' }}>
          <h2
            id="nf-popular"
            // 사이트는 en-NZ — 404 안내도 영어(2026-11-01). 라틴 라벨이라 위 카테고리 라벨과 같은 대문자·자간.
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 8px' }}
          >
            Most Read
          </h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {popular.map((post, i) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  data-track="not_found_popular_click"
                  data-track-slug={post.slug}
                  data-track-position={i + 1}
                  style={{ display: 'block', padding: '16px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)' }}
                >
                  <span style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{post.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Link
        href="/"
        style={{
          marginTop: '8px',
          display: 'inline-block',
          padding: '16px 32px',
          borderRadius: '999px',
          background: 'var(--text)',
          color: 'var(--bg)',
          fontSize: '14px',
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'opacity 0.2s ease',
        }}
      >
        Back to home
      </Link>
    </>
  );
}
