import { Suspense } from 'react';
import UnsubscribeClient from './_client';

export const metadata = {
  title: '구독 해지 — Mairangi Notes',
  robots: 'noindex',
};

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-tertiary)',
        fontSize: 14,
      }}>
        로딩 중...
      </div>
    }>
      <UnsubscribeClient />
    </Suspense>
  );
}
