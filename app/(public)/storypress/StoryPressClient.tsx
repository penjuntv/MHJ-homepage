'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BookOpen, RefreshCw, Users, Sparkles, ChevronDown } from 'lucide-react';
import StoryPressFAQ from '@/components/StoryPressFAQ';

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
    highlight: '4',
    highlightSub: 'Words a Day',
    title: '4 Words a Day',
    desc: 'Just 4 words a day — no overwhelm, just steady progress your child can feel.',
  },
  {
    icon: BookOpen,
    color: '#6D7AFA',
    bg: '#EEF2FF',
    highlight: null,
    highlightSub: null,
    title: 'Story-Based Learning',
    desc: 'Words come alive through stories children love — context makes them stick.',
  },
  {
    icon: RefreshCw,
    color: '#10B981',
    bg: '#ECFDF5',
    highlight: null,
    highlightSub: null,
    title: 'Smart Repetition',
    desc: 'Smart repetition that sticks without boring drills or pressure.',
  },
  {
    icon: Users,
    color: '#EC4899',
    bg: '#FDF2F8',
    highlight: null,
    highlightSub: null,
    title: 'For Bilingual Families',
    desc: 'Built for bilingual families navigating two languages, two worlds.',
  },
];

const STEPS = [
  { num: '01', label: 'Listen', desc: 'Hear each word with native pronunciation and understand its meaning in context.' },
  { num: '02', label: 'Practice', desc: 'Repeat and practise through short, enjoyable games — no pressure, just play.' },
  { num: '03', label: 'Review', desc: 'Smart review the next day reinforces memory and makes words stick for good.' },
];

export default function StoryPressClient({ title, description, heroImageUrl }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  const [hoverFeature, setHoverFeature] = useState<number | null>(null);

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

      {/* ─── 히어로 — 2컬럼 ─── */}
      <section style={{
        minHeight: '80vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))',
        alignItems: 'center',
        gap: 'clamp(40px, 6vw, 80px)',
        padding: 'clamp(64px, 8vw, 112px) clamp(24px, 4vw, 80px)',
        background: 'linear-gradient(135deg, #FFF4EE 0%, #F0F4FF 50%, #F0FDF9 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 배경 장식 원 */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 'clamp(200px, 35vw, 480px)', height: 'clamp(200px, 35vw, 480px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,186,116,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: 'clamp(120px, 25vw, 320px)', height: 'clamp(120px, 25vw, 320px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,243,208,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* 좌: 텍스트 */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#F59E42', marginBottom: 24 }}>
            From Our Family · ESOL · Ages 5–12
          </p>
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(56px, 10vw, 120px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: -4, lineHeight: 0.88, color: 'var(--text)', marginBottom: 28 }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: 500, color: '#64748B', lineHeight: 1.65, marginBottom: 40, maxWidth: 480 }}>
            {description || (<>A gentle way to learn English,{' '}<span style={{ fontWeight: 900, color: '#F59E42' }}>4 words at a time.</span>{' '}Built for bilingual families navigating two languages.</>)}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href="#storypress-signup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 40px', borderRadius: 999, background: '#1A1A1A', color: '#fff', fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none', boxShadow: '0 16px 32px rgba(0,0,0,0.15)' }}
            >
              Join the Waitlist
            </a>
            <a
              href="#why-storypress"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 999, background: 'rgba(255,255,255,0.7)', color: '#1A1A1A', fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none', border: '1px solid rgba(0,0,0,0.1)' }}
            >
              Learn More <ChevronDown size={14} />
            </a>
          </div>
        </div>

        {/* 우: 히어로 이미지(있으면) 또는 앱 목업 카드 */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
          {heroImageUrl ? (
            <div style={{
              width: '100%', maxWidth: 420,
              aspectRatio: '4/5',
              borderRadius: 40,
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.14)',
              position: 'relative',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImageUrl}
                alt="StoryPress"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
          <div style={{ width: '100%', maxWidth: 360, background: 'var(--bg-card)', borderRadius: 40, padding: 32, boxShadow: '0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)', position: 'relative' }}>
            {/* 앱 상단 바 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #F59E42, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={20} color="white" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: -0.5 }}>StoryPress</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: 0, fontWeight: 600, letterSpacing: 1 }}>TODAY&apos;S LESSON</p>
              </div>
            </div>
            {/* 단어 카드들 */}
            {[
              { word: 'Curious', korean: 'feeling eager to know', color: '#FFF7ED', border: '#FED7AA' },
              { word: 'Discover', korean: 'to find something new', color: '#F0F4FF', border: '#C7D2FE' },
              { word: 'Journey', korean: 'a long trip or adventure', color: '#ECFDF5', border: '#A7F3D0' },
              { word: 'Wonder', korean: 'a feeling of amazement', color: '#FDF2F8', border: '#FBCFE8' },
            ].map((item, i) => (
              <div key={i} style={{ background: item.color, border: `1px solid ${item.border}`, borderRadius: 16, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: -0.3 }}>{item.word}</p>
                  <p style={{ fontSize: 11, color: '#64748B', margin: 0, fontWeight: 500 }}>{item.korean}</p>
                </div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <span style={{ fontSize: 13 }}>▶</span>
                </div>
              </div>
            ))}
            {/* 진행 바 */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: 1, textTransform: 'uppercase' }}>Progress</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#F59E42' }}>4 / 4 words</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: '#F1F5F9', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #F59E42, #F97316)', width: '100%', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section
        id="why-storypress"
        ref={featuresAnim.ref}
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
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
            const isHovered = hoverFeature === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoverFeature(i)}
                onMouseLeave={() => setHoverFeature(null)}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 32,
                  padding: 'clamp(28px, 3vw, 40px)',
                  cursor: 'default',
                  opacity: featuresAnim.visible ? 1 : 0,
                  transform: isHovered
                    ? 'translateY(-8px)'
                    : featuresAnim.visible ? 'none' : 'translateY(30px)',
                  boxShadow: isHovered
                    ? '0 20px 48px rgba(0,0,0,0.12)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: isHovered
                    ? 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s'
                    : `all 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Icon size={24} color={f.color} />
                </div>

                {/* 숫자 강조 (첫 번째 카드) */}
                {f.highlight ? (
                  <div style={{ marginBottom: 12 }}>
                    <span
                      className="font-display"
                      style={{
                        fontSize: 'clamp(48px, 6vw, 64px)',
                        fontWeight: 900,
                        fontStyle: 'italic',
                        letterSpacing: -3,
                        lineHeight: 1,
                        color: f.color,
                        display: 'inline',
                      }}
                    >
                      {f.highlight}
                    </span>
                    {f.highlightSub && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: 3,
                        textTransform: 'uppercase',
                        color: f.color,
                        marginLeft: 8,
                        verticalAlign: 'middle',
                      }}>
                        {f.highlightSub}
                      </span>
                    )}
                  </div>
                ) : (
                  <h3 style={{
                    fontSize: 18, fontWeight: 900, color: 'var(--text)',
                    letterSpacing: '-0.5px', marginBottom: 12,
                  }}>
                    {f.title}
                  </h3>
                )}
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
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
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
              color: 'var(--text)',
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
                  background: 'var(--bg-card)',
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
                  fontSize: 22, fontWeight: 900, color: 'var(--text)',
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

      {/* ─── 인용문 ─── */}
      <section
        ref={quoteAnim.ref}
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          textAlign: 'center',
          opacity: quoteAnim.visible ? 1 : 0,
          transform: quoteAnim.visible ? 'none' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
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
              My child picks up 4 new words every day —<br />
              and their confidence keeps growing.
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

      {/* ─── FAQ ─── */}
      <StoryPressFAQ />

      {/* ─── 대기자 등록 폼 ─── */}
      <section
        id="storypress-signup"
        ref={formAnim.ref}
        style={{
          padding: 'clamp(64px, 7vw, 96px) clamp(24px, 4vw, 80px)',
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
                You&apos;re on the list!<br />
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
