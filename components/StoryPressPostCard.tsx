interface Props {
  title: string;
  intro: string;
  ctaUrl: string;
  ctaText: string;
  category: string;
}

/**
 * 글 안의 StoryPress 카드 — Little 15 Mins · Home Learning 글에만(이전·다음 카드 뒤, 관련글 앞).
 * (옛 홈용 `StoryPressSection` — 65vh 히어로, import 0 — 은 W6-C 에서 지웠다. /storypress 랜딩은 `StoryPressClient`.)
 * 문구는 사이트 설정의 `storypress_title`(랜딩 섹션 제목)·`pillar_storypress_intro`(홈 기둥 부제)를 **빌려 쓴다** —
 * 그 두 칸을 고치면 이 카드도 34편에서 함께 바뀐다. 카드 전용 문구가 필요해지면 관리자 설정에 칸을 따로 둔다(CLAUDE.md 9).
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
      <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
        From our family · StoryPress
      </p>
      <h2
        id="storypress-card-title"
        className="font-display"
        style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontStyle: 'italic', lineHeight: 1.2, color: 'var(--text)', margin: '0 0 16px', whiteSpace: 'pre-line' }}
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
          padding: '16px 24px',
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
