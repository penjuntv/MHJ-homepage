import Link from 'next/link';

/* 숨김 호를 관리자 미리보기(draftMode)로 볼 때만 뜨는 안내 띠 — 블로그 초안 미리보기 띠와 같은 모양.
   일반 방문자에게는 이 호 주소가 404 라 이 띠가 그려질 일이 없다(lib/magazine-visibility.ts). */
export default function IssuePreviewBanner() {
  return (
    <div
      style={{
        background: '#FEF3C7',
        borderBottom: '1px solid #FDE68A',
        padding: '14px clamp(24px, 4vw, 48px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', margin: 0 }}>
        미리보기 모드 — 숨김 처리된 호입니다 (방문자에게는 보이지 않습니다)
      </p>
      <Link
        href="/api/preview-exit?to=magazines"
        prefetch={false}
        style={{
          fontSize: 11, fontWeight: 900, color: '#92400E',
          textDecoration: 'none', letterSpacing: 2,
          textTransform: 'uppercase', flexShrink: 0,
          border: '1px solid #FCD34D', borderRadius: 999,
          padding: '6px 14px', background: 'rgba(255,255,255,0.5)',
        }}
      >
        ← 어드민으로 돌아가기
      </Link>
    </div>
  );
}
