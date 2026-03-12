'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'StoryPress가 뭔가요?',
    a: 'StoryPress는 이중언어 가정의 아이들을 위한 영어 어휘 학습 앱입니다. 하루 4단어씩, 스토리 기반으로 자연스럽게 영어를 익힐 수 있도록 설계되었습니다. 뉴질랜드 오클랜드에 사는 한국인 가족의 실제 경험에서 탄생했습니다.',
  },
  {
    q: '어떤 아이들에게 맞나요?',
    a: '만 5세~12세(Year 1~Year 8)의 이중언어 환경 아이들에게 가장 효과적입니다. 특히 영어가 제2언어인 가정, 해외 이민·유학 가정, 국제학교 재학생에게 맞춤화되어 있습니다.',
  },
  {
    q: '어떻게 학습하나요?',
    a: '매일 4개의 단어를 원어민 발음으로 듣고 → 짧은 스토리 안에서 맥락으로 이해하고 → 간단한 게임으로 연습합니다. 다음 날 자동으로 복습이 예약되어 기억이 오래 지속됩니다.',
  },
  {
    q: '가격은 얼마인가요?',
    a: '현재 개발 중이며 정식 출시 전까지 대기자 명단에 등록하신 분들께는 얼리버드 혜택이 제공됩니다. 지금 바로 무료로 대기자 명단에 등록하세요.',
  },
  {
    q: '다른 영어 앱과 뭐가 다른가요?',
    a: '대부분의 앱은 단순 반복·암기 방식입니다. StoryPress는 이야기 속 맥락으로 단어를 배우기 때문에 뜻만이 아니라 쓰임새까지 자연스럽게 익힙니다. 또한 이중언어 가정의 특수한 상황(한국어·영어 혼용 환경)을 이해하고 설계된 유일한 앱입니다.',
  },
  {
    q: '부모 대시보드가 있나요?',
    a: '네, 부모님이 아이의 학습 진도를 확인하고 오늘 배운 단어를 함께 복습할 수 있는 대시보드가 제공됩니다. 가족이 함께 배움을 나눌 수 있도록 설계되었습니다.',
  },
];

export default function StoryPressFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function toggle(idx: number) {
    setOpenIdx(prev => (prev === idx ? null : idx));
  }

  return (
    <section
      style={{
        padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
        background: 'linear-gradient(135deg, #FFF4EE 0%, #F0F4FF 50%, #F0FDF9 100%)',
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
              color: '#1A1A1A',
            }}
          >
            자주 묻는 질문
          </h2>
        </div>

        {/* 아코디언 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(12px)',
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
                    color: isOpen ? '#F59E42' : '#1A1A1A',
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

                {/* 답변 (grid-template-rows 애니메이션) */}
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
