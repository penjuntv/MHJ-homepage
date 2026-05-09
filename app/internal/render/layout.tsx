import type { ReactNode } from 'react';

export default function CaptureRenderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #fff;
        }
      `}</style>
      {children}
    </>
  );
}
