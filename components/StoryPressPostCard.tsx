interface Props {
  title: string;
  intro: string;
  ctaUrl: string;
  ctaText: string;
  category: string;
}

/**
 * 글 안의 StoryPress 카드 — Little 15 Mins · Home Learning 글에만(이전·다음 카드 뒤, 관련글 앞).
 * 홈용 `StoryPressSection`(65vh 검은 히어로, 제목 최대 120px)은 글 사이에 넣을 크기가 아니라 따로 둔다.
 * CTA 는 외부 앱(app.mhj.nz)이라 구독자 행이 생기지 않는다 — 전환은 `data-track` 클릭으로 잰다
 * (2026-09-11 W6-C 결정 ③: 계획서의 `subscribers.source='storypress'` 대체).
 */
export default function StoryPressPostCard({ title, intro, ctaUrl, ctaText, category }: Props) {
  const href = ctaUrl.trim() || '/storypress';
  return (
    <section
      aria-labelledby="storypress-card-title"
      style={{
        margin: '0 0 64px',
        padding: 'clamp(24px, 4vw, 40px)',
        borderRadius: 12,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
        From our family · StoryPress
      </p>
      <h2
        id="storypress-card-title"
        className="font-display"
        style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontStyle: 'italic', lineHeight: 1.2, color: 'var(--text)', margin: '0 0 12px', whiteSpace: 'pre-line' }}
      >
        {title}
      </h2>
      {intro && (
        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 24px' }}>{intro}</p>
      )}
      <a
        href={href}
        data-track="storypress_click"
        data-track-location="blog_post"
        data-track-category={category}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '12px 24px',
          borderRadius: 999,
          background: 'var(--text)',
          color: 'var(--bg)',
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}
      >
        {ctaText || 'Learn more'} →
      </a>
    </section>
  );
}
