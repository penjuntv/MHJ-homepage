'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BookOpen, RefreshCw, Users, Sparkles, ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  heroImageUrl: string;
}

function useSlideUp(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const FEATURES = [
  {
    icon: Sparkles,
    color: '#F59E42',
    bg: '#FFF7ED',
    title: '하루 4단어',
    desc: 'Just 4 words a day — no overwhelm, just steady progress your child can feel.',
  },
  {
    icon: BookOpen,
    color: '#6D7AFA',
    bg: '#EEF2FF',
    title: '스토리 기반 학습',
    desc: 'Words come alive through stories children love — context makes them stick.',
  },
  {
    icon: RefreshCw,
    color: '#10B981',
    bg: '#ECFDF5',
    title: '스마트 반복',
    desc: 'Smart repetition that sticks without boring drills or pressure.',
  },
  {
    icon: Users,
    color: '#EC4899',
    bg: '#FDF2F8',
    title: '이중언어 가족을 위해',
    desc: 'Built for bilingual families navigating two languages, two worlds.',
  },
];

const STEPS = [
  { num: '01', label: 'Listen', desc: '원어민 발음으로 단어를 듣고 뜻을 이해해요.' },
  { num: '02', label: 'Practice', desc: '따라 말하고 작은 게임으로 즐겁게 연습해요.' },
  { num: '03', label: 'Review', desc: '다음 날 자연스럽게 복습하며 기억을 굳혀요.' },
];

export default function StoryPressClient({ title }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  const featuresAnim = useSlideUp();
  const stepsAnim = useSlideUp();
  const quoteAnim = useSlideUp();
  const formAnim = useSlideUp();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: 'StoryPress Waitlist', source: 'storypress' }),
    });
    if (res.ok) { setStatus('success'); setEmail(''); }
    else if (res.status === 409) setStatus('duplicate');
    else setStatus('error');
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ─── 히어로 ─── */}
      <section style={{
        minHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 80px) clamp(60px, 8vw, 100px)',
        background: 'linear-gradient(135deg, #FFF4EE 0%, #F0F4FF 40%, #F0FDF9 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 배경 장식 원 */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 'clamp(200px, 40vw, 500px)', height: 'clamp(200px, 40vw, 500px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(253,186,116,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-5%', left: '-5%',
          width: 'clamp(150px, 30vw, 400px)', height: 'clamp(150px, 30vw, 400px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,243,208,0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 800 }}>
          {/* 라벨 */}
          <p style={{
            fontSize: 10, fontWeight: 900, letterSpacing: 5,
            textTransform: 'uppercase', color: '#F59E42',
            marginBottom: 28,
          }}>
            From Our Family · ESOL · Ages 5–12
          </p>

          {/* 대형 제목 */}
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(64px, 14vw, 160px)',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: -5,
              lineHeight: 0.85,
              color: '#1A1A1A',
              marginBottom: 40,
            }}
          >
            {title}
          </h1>

          {/* 서브타이틀 */}
          <p style={{
            fontSize: 'clamp(18px, 2.5vw, 26px)',
            fontWeight: 500,
            color: '#64748B',
            lineHeight: 1.6,
            marginBottom: 56,
            maxWidth: 560,
            margin: '0 auto 56px',
          }}>
            A gentle way to learn English,{' '}
            <span style={{ fontWeight: 900, color: '#F59E42' }}>4 words at a time</span>
          </p>

          {/* CTA 버튼 */}
          <a
            href="#storypress-signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: 'clamp(16px, 2vw, 22px) clamp(32px, 4vw, 52px)',
              borderRadius: 999,
              background: '#1A1A1A',
              color: '#fff',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 3,
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            Join the Waitlist
          </a>
        </div>

        {/* 스크롤 힌트 */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          opacity: 0.35,
        }}>
          <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}>Scroll</p>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* ─── Features ─── */}
      <section
        ref={featuresAnim.ref}
        style={{
          padding: 'clamp(60px, 8vw, 120px) clamp(24px, 4vw, 80px)',
          maxWidth: 1200, margin: '0 auto',
          opacity: featuresAnim.visible ? 1 : 0,
          transform: featuresAnim.visible ? 'none' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ marginBottom: 64, textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 16 }}>
            Why StoryPress
          </p>
          <h2 className="font-display font-black" style={{
            fontSize: 'clamp(32px, 5vw, 64px)',
            letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic',
            color: 'var(--text)',
          }}>
            Designed for how kids actually learn
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
          gap: 24,
        }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 32,
                  padding: 'clamp(28px, 3vw, 40px)',
                  opacity: featuresAnim.visible ? 1 : 0,
                  transform: featuresAnim.visible ? 'none' : 'translateY(30px)',
                  transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 24,
                }}>
                  <Icon size={24} color={f.color} />
                </div>
                <h3 style={{
                  fontSize: 18, fontWeight: 900, color: 'var(--text)',
                  letterSpacing: '-0.5px', marginBottom: 12,
                }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section
        ref={stepsAnim.ref}
        style={{
          padding: 'clamp(60px, 8vw, 120px) clamp(24px, 4vw, 80px)',
          background: 'linear-gradient(135deg, #FFF7ED 0%, #F0F4FF 100%)',
          opacity: stepsAnim.visible ? 1 : 0,
          transform: stepsAnim.visible ? 'none' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 64, textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 16 }}>
              Simple by Design
            </p>
            <h2 className="font-display font-black" style={{
              fontSize: 'clamp(32px, 5vw, 64px)',
              letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic',
              color: '#1A1A1A',
            }}>
              How It Works
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
            gap: 32,
          }}>
            {STEPS.map((step, i) => (
              <div
                key={i}
                style={{
                  background: 'white',
                  borderRadius: 32,
                  padding: 'clamp(32px, 4vw, 48px)',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: stepsAnim.visible ? 1 : 0,
                  transform: stepsAnim.visible ? 'none' : 'translateY(30px)',
                  transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.15}s`,
                }}
              >
                {/* 배경 숫자 */}
                <div className="font-display" style={{
                  position: 'absolute', top: -16, right: 16,
                  fontSize: 120, fontWeight: 900, fontStyle: 'italic',
                  color: 'rgba(0,0,0,0.04)', lineHeight: 1, letterSpacing: -4,
                  pointerEvents: 'none', userSelect: 'none',
                }}>
                  {step.num}
                </div>

                {/* 번호 */}
                <p className="font-display" style={{
                  fontSize: 'clamp(48px, 6vw, 72px)',
                  fontWeight: 900, fontStyle: 'italic',
                  letterSpacing: -3, lineHeight: 1,
                  color: '#F59E42',
                  marginBottom: 20,
                }}>
                  {step.num}
                </p>
                <h3 style={{
                  fontSize: 22, fontWeight: 900, color: '#1A1A1A',
                  letterSpacing: '-0.5px', marginBottom: 12,
                }}>
                  {step.label}
                </h3>
                <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 사회적 증명 (인용문) ─── */}
      <section
        ref={quoteAnim.ref}
        style={{
          padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 80px)',
          textAlign: 'center',
          opacity: quoteAnim.visible ? 1 : 0,
          transform: quoteAnim.visible ? 'none' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* 큰 따옴표 */}
          <div className="font-display" style={{
            fontSize: 'clamp(80px, 14vw, 160px)',
            fontWeight: 900,
            lineHeight: 0.6,
            color: '#F59E42',
            opacity: 0.3,
            marginBottom: 16,
            fontStyle: 'italic',
          }}>
            &ldquo;
          </div>
          <blockquote>
            <p className="font-display" style={{
              fontSize: 'clamp(22px, 3.5vw, 36px)',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: '-1px',
              lineHeight: 1.4,
              color: 'var(--text)',
              marginBottom: 32,
            }}>
              우리 아이가 매일 4단어씩 배우며<br />
              자신감을 찾아가고 있어요.
            </p>
            <cite style={{
              fontSize: 12, fontWeight: 900, letterSpacing: 3,
              textTransform: 'uppercase', color: 'var(--text-tertiary)',
              fontStyle: 'normal',
            }}>
              — Mairangi Bay Family
            </cite>
          </blockquote>
        </div>
      </section>

      {/* ─── 대기자 등록 폼 ─── */}
      <section
        id="storypress-signup"
        ref={formAnim.ref}
        style={{
          padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 80px)',
          background: '#0A0A0A',
          opacity: formAnim.visible ? 1 : 0,
          transform: formAnim.visible ? 'none' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            fontSize: 10, fontWeight: 900, letterSpacing: 5,
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
            marginBottom: 24,
          }}>
            Be the First to Know
          </p>
          <h2 className="font-display font-black" style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 900, fontStyle: 'italic',
            letterSpacing: -3, lineHeight: 0.9,
            color: 'white', marginBottom: 20,
          }}>
            Join the Waitlist
          </h2>
          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)',
            color: 'rgba(255,255,255,0.45)',
            fontWeight: 500, lineHeight: 1.7, marginBottom: 48,
          }}>
            StoryPress is currently in development.<br />
            Sign up to be the first to know when we launch.
          </p>

          {status === 'success' ? (
            <div style={{
              padding: '32px 40px', borderRadius: 24,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                You&apos;re on the list! 🎉<br />
                <span style={{ fontWeight: 500, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                  We&apos;ll let you know when StoryPress launches.
                </span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    flex: '1 1 240px',
                    padding: '18px 24px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'white',
                    fontSize: 15, fontWeight: 500,
                    outline: 'none', minWidth: 0,
                  }}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="font-black uppercase"
                  style={{
                    padding: '18px 36px', borderRadius: 999,
                    background: status === 'loading' ? 'rgba(255,255,255,0.6)' : 'white',
                    color: '#0A0A0A', border: 'none',
                    fontSize: 12, letterSpacing: 3,
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  {status === 'loading' ? '...' : 'Join Waitlist'}
                </button>
              </div>
              {status === 'duplicate' && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 12 }}>
                  You&apos;re already on the list — thank you!
                </p>
              )}
              {status === 'error' && (
                <p style={{ fontSize: 13, color: '#f87171', marginTop: 12 }}>
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          )}

          <p style={{ marginTop: 32, fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* ─── 하단 링크 ─── */}
      <div style={{
        padding: '32px clamp(24px, 4vw, 80px)',
        background: '#0A0A0A',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
      }}>
        <Link href="/" style={{
          fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)', textDecoration: 'none',
        }}>
          ← Back to MY MAIRANGI
        </Link>
      </div>

    </div>
  );
}
