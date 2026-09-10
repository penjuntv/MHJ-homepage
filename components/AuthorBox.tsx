import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { getAuthor } from '@/lib/seo';

/**
 * 글 하단 저자 박스 — 사진 · 자격 · 소개 · /about 링크. 코드 1회로 발행 전편에 적용된다.
 * 자체진단(2026-09-07): 저자 자격이 /about 에만 있고 글 페이지엔 이름 텍스트뿐이라 E-E-A-T·AI 인용 신뢰가 0 이었다.
 * 등록된 저자(lib/seo AUTHORS)만 그린다 — 매거진 기사 저자(Min/Hyun/Jin)처럼 프로필이 없으면 null. 같은 레지스트리가
 * Person @id 를 만들므로 "스키마엔 저자가 있는데 박스는 없는" 상태가 생기지 않는다.
 * DESIGN_RULES: 색은 토큰만, radius 는 §8.2 가 허용하는 프로필 원형뿐, 호버 없음, 간격 8의 배수(32·16·8).
 */
export default function AuthorBox({ author }: { author: string }) {
  const a = getAuthor(author);
  if (!a) return null;
  // 이름이 붙은 <aside> 는 <article> 안에서도 complementary 랜드마크로 남는다 —
  // 레이아웃의 <main> 안이라 랜드마크가 중첩된다(DESIGN_RULES §15.5).
  return (
    <div
      style={{ margin: '48px 0 0', borderTop: '1px solid var(--border)', padding: '32px 0 0', display: 'flex', gap: 16, alignItems: 'flex-start' }}
    >
      {a.image && (
        <div style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
          <SafeImage src={a.image} alt={a.name} fill sizes="56px" className="object-cover" />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text)', margin: 0 }}>
          {a.name}
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: '8px 0 0', letterSpacing: 0.5 }}>
          {a.title}
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)', margin: '8px 0 0' }}>{a.bio}</p>
        <Link
          href={a.href}
          style={{ display: 'inline-block', marginTop: 16, fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          More about {a.name} →
        </Link>
      </div>
    </div>
  );
}
