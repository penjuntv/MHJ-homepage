// Slide #10 — CTA
import { carouselTokens } from '../tokens';
import type { CarouselInput } from '../types';

export function CtaSlide(input: CarouselInput) {
  const { colors } = carouselTokens;
  const styleConfig = carouselTokens.styles[input.style] || carouselTokens.styles.default;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: styleConfig.bg,
        padding: '120px 100px',
        fontFamily: 'Inter, "Noto Sans KR", sans-serif',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: 36,
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          color: colors.accent,
          letterSpacing: 8,
          marginBottom: 60,
        }}
      >
        MHJ
      </div>

      <div
        style={{
          width: 60,
          height: 3,
          background: colors.accent,
          marginBottom: 50,
          display: 'flex',
        }}
      />

      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.2,
          color: styleConfig.text,
          textAlign: 'center',
          marginBottom: 30,
          maxWidth: 880,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {input.ctaTitle}
      </div>

      <div
        style={{
          fontSize: 22,
          fontFamily: '"Noto Sans KR", sans-serif',
          color: colors.textSecondary,
          marginBottom: 70,
          display: 'flex',
        }}
      >
        프로필 링크에서 전문 읽기 · 阅读全文请看主页链接
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 16,
          marginBottom: 80,
        }}
      >
        {['💾 Save', '📩 Send', '👤 Follow'].map((cta) => (
          <div
            key={cta}
            style={{
              background: colors.accent,
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: 700,
              padding: '18px 32px',
              borderRadius: carouselTokens.decoration.ctaButtonRadius,
              display: 'flex',
              marginRight: 8,
            }}
          >
            {cta}
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 18,
          color: colors.textSecondary,
          letterSpacing: 3,
          display: 'flex',
        }}
      >
        {input.instagramHandle || '@mhj_nz'} · www.mhj.nz
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 100,
          right: 100,
          display: 'flex',
          justifyContent: 'center',
          fontSize: 14,
          color: colors.textTertiary,
          letterSpacing: 2,
        }}
      >
        10 / 10
      </div>
    </div>
  );
}
