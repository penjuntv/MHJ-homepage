'use client';

import { useEffect, useState } from 'react';

export default function DebugOverflow() {
  const [offenders, setOffenders] = useState<string[]>([]);

  useEffect(() => {
    const check = () => {
      const w = document.documentElement.clientWidth;
      const found: string[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > w + 1) {
          const tag = el.tagName.toLowerCase();
          const cls = (el as HTMLElement).className;
          const label = typeof cls === 'string' && cls.trim()
            ? `${tag}.${cls.trim().split(' ')[0]}`
            : tag;
          found.push(`right=${Math.round(rect.right)} ${label}`);
        }
      });
      setOffenders(found.slice(0, 8));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (offenders.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: 'rgba(220,38,38,0.95)',
      color: 'white',
      fontSize: 11,
      padding: '6px 10px',
      lineHeight: 1.6,
      fontFamily: 'monospace',
    }}>
      <strong>OVERFLOW ({offenders.length}):</strong><br />
      {offenders.map((o, i) => <span key={i}>{o}<br /></span>)}
    </div>
  );
}
