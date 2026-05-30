'use client';

import { useState } from 'react';
import { STORYPRESS_FAQS as FAQS } from '@/lib/storypress-faqs';

export default function StoryPressFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function toggle(idx: number) {
    setOpenIdx(prev => (prev === idx ? null : idx));
  }

  return (
    <section
      className="sp-hero-section"
      style={{
        padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#F59E42', marginBottom: 16 }}>
            FAQ
          </p>
          <h2
            className="font-display font-black"
            style={{
              fontSize: 'clamp(28px, 4.5vw, 52px)',
              letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic',
              color: 'var(--text)',
            }}
          >
            Frequently Asked Questions
          </h2>
        </div>

        {/* 아코디언 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="sp-faq-card"
                style={{
                  borderRadius: 24,
                  border: isOpen ? '1px solid rgba(245,158,66,0.35)' : '1px solid rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  transition: 'border-color 0.25s',
                }}
              >
                {/* 질문 버튼 */}
                <button
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: 'clamp(18px, 2.5vw, 24px) clamp(20px, 3vw, 28px)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: 'clamp(14px, 1.8vw, 16px)',
                    fontWeight: 900,
                    color: isOpen ? '#F59E42' : 'var(--text)',
                    letterSpacing: '-0.3px',
                    lineHeight: 1.4,
                    transition: 'color 0.25s',
                  }}>
                    {item.q}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      width: 28, height: 28,
                      borderRadius: '50%',
                      background: isOpen ? '#F59E42' : 'rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 900,
                      color: isOpen ? 'white' : '#64748B',
                      transition: 'background 0.25s, color 0.25s',
                      lineHeight: 1,
                    }}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {/* 답변 */}
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  aria-labelledby={`faq-question-${idx}`}
                  style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{
                      padding: '0 clamp(20px, 3vw, 28px) clamp(18px, 2.5vw, 24px)',
                      fontSize: 'clamp(13px, 1.6vw, 15px)',
                      color: '#64748B',
                      lineHeight: 1.75,
                      fontWeight: 500,
                      margin: 0,
                    }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
