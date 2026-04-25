import { Suspense } from 'react';
import UnsubscribeClient from './_client';

export const metadata = {
  title: 'Unsubscribe — Mairangi Notes',
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
        Loading...
      </div>
    }>
      <UnsubscribeClient />
    </Suspense>
  );
}
