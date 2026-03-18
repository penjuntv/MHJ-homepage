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
    title: 'Just 4 Words a Day',
    desc: 'No overwhelm. No homework. Just 4 new words, a short game, and a story page — in about 10 minutes. Small enough to fit into any day.',
  },
  {
    icon: BookOpen,
    color: '#6D7AFA',
    bg: '#EEF2FF',
    highlight: null,
    highlightSub: null,
    title: 'Every Word Becomes a Story',
    desc: "Your child doesn't memorise a list. They meet words inside stories they help create — and that's what makes them remember.",
  },
  {
    icon: RefreshCw,
    color: '#10B981',
    bg: '#ECFDF5',
    highlight: null,
    highlightSub: null,
    title: 'A Book They Made Themselves',
    desc: "After 10 days, your child has a finished storybook with their name on the cover. Not a certificate. Not a score. A real book.",
  },
  {
    icon: Users,
    color: '#EC4899',
    bg: '#FDF2F8',
    highlight: null,
    highlightSub: null,
    title: 'Made for Families Like Ours',
    desc: "We're an immigrant family in Auckland. We built StoryPress for children growing up between two languages — where English isn't just a subject, it's part of everyday life.",
  },
];

const STEPS = [
  {
    num: '01',
    label: 'Meet & Play',
    desc: "Every day, your child meets 4 new English words — with pictures and sound. Then they play short games: spelling, matching, filling in sentences. It feels like play, because it is.",
  },
  {
    num: '02',
    label: 'Create',
    desc: "Today's 4 words become today's story page. Your child colours the scene and hears the story read aloud. Every page is something they made — not something they watched.",
  },
  {
    num: '03',
    label: 'Collect',
    desc: "A new page every day. A finished book every 10 days. With your child's name on the cover and their choices on every page. It's a real storybook — and they're the author.",
  },
];

export default function StoryPressClient({ title, description, heroImageUrl }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  const [hoverFeature, setHoverFeature] = useState<number | null>(null);

  const featuresAnim = useSlideUp();
  const stepsAnim = useSlideUp();
  const libraryAnim = useSlideUp();
  const researchAnim = useSlideUp();
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
      <section className="sp-hero-section" style={{
        minHeight: '80vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))',
        alignItems: 'center',
        gap: 'clamp(40px, 6vw, 80px)',
        padding: 'clamp(64px, 8vw, 112px) clamp(24px, 4vw, 80px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 배경 장식 원 */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 'clamp(200px, 35vw, 480px)', height: 'clamp(200px, 35vw, 480px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,186,116,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: 'clamp(120px, 25vw, 320px)', height: 'clamp(120px, 25vw, 320px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,243,208,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* 좌: 텍스트 */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#F59E42', marginBottom: 24 }}>
            From Our Family · ESOL · Ages 3–8
          </p>
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(56px, 10vw, 120px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: -4, lineHeight: 0.88, color: 'var(--text)', marginBottom: 28 }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: 500, color: '#64748B', lineHeight: 1.65, marginBottom: 40, maxWidth: 480 }}>
            {description || (
              <>
                Four new words today. A story page tonight.{' '}
                A real book by the end of the month —{' '}
                <span style={{ fontWeight: 900, color: '#F59E42' }}>with your child&apos;s name on the cover.</span>
              </>
            )}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href="#storypress-signup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 40px', borderRadius: 999, background: '#1A1A1A', color: '#fff', fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none', boxShadow: '0 16px 32px rgba(0,0,0,0.15)' }}
            >
              Start Your Free Adventure
            </a>
            <a
              href="#why-storypress"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 999, background: 'rgba(255,255,255,0.7)', color: '#1A1A1A', fontSize: 12, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none', border: '1px solid rgba(0,0,0,0.1)' }}
            >
              See How It Works <ChevronDown size={14} />
            </a>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, marginTop: 16, letterSpacing: 1 }}>
            Free to try · No credit card needed
          </p>
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
          <div style={{ width: '100%', maxWidth: 360, background: 'var(--bg-card)', borderRadius: 40, padding: 32, boxShadow: '0 32px 80px rgba(74,55,40,0.12), 0 8px 24px rgba(0,0,0,0.06)', position: 'relative' }}>
            {/* 앱 상단 바 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FF8B5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={20} color="white" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: -0.5 }}>StoryPress</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: 0, fontWeight: 600, letterSpacing: 1 }}>TODAY&apos;S WORDS</p>
              </div>
            </div>
            {/* 단어 카드들 */}
            {[
              { word: 'Dog',   korean: 'a friendly animal',  color: '#FFF5E8', border: '#FFD4A8' },
              { word: 'Run',   korean: 'to move fast',        color: '#FFE8EE', border: '#F0B8C8' },
              { word: 'Happy', korean: 'feeling good',        color: '#E8F8F0', border: '#A8E0C0' },
              { word: 'Park',  korean: 'a place to play',     color: '#E8F0FF', border: '#B8D0F0' },
            ].map((item, i) => (
              <div key={i} className="sp-word-card" style={{ background: item.color, border: `1px solid ${item.border}`, borderRadius: 16, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#FF8B5E', letterSpacing: 1 }}>
                  4 words → 1 story page
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: '#F0E8E0', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #FF8B5E, #FFB088)', width: '100%', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* ─── Features (Why StoryPress) ─── */}
      <section
        id="why-storypress"
        ref={featuresAnim.ref}
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          maxWidth: 1200, margin: '0 auto',
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
            Why parents choose StoryPress
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
                <div className="sp-feature-icon" style={{
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
        className="sp-steps-bg"
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          transform: stepsAnim.visible ? 'none' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 64, textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 16 }}>
              Three steps to a real storybook
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

          {/* 킬러 라인 */}
          <p style={{
            textAlign: 'center',
            fontSize: 'clamp(16px, 2vw, 20px)',
            fontWeight: 900,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            letterSpacing: '-0.5px',
            marginTop: 56,
            fontFamily: 'var(--font-display, serif)',
          }}>
            &ldquo;Other apps end at a lesson. StoryPress ends with a book.&rdquo;
          </p>
        </div>
      </section>

      {/* ─── A Growing Library ─── */}
      <section
        ref={libraryAnim.ref}
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          maxWidth: 1200, margin: '0 auto',
          transform: libraryAnim.visible ? 'none' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 16 }}>
            A Growing Library
          </p>
          <h2 className="font-display font-black" style={{
            fontSize: 'clamp(28px, 4.5vw, 52px)',
            letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic',
            color: 'var(--text)', marginBottom: 24,
          }}>
            A growing library of books they made themselves
          </h2>
          <p style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 640, margin: '0 auto 32px' }}>
            Every day, your child creates a new story page. After 10 days, all the pages come together into a finished book — with their name right there on the cover. Then a new story begins.
          </p>
          {/* 통계 3개 */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {['10 min a day', '40+ words per book', 'A new book every 10 days'].map((stat, i) => (
              <span key={i} style={{ fontSize: 13, fontWeight: 900, color: '#F59E42', letterSpacing: 1, textTransform: 'uppercase' }}>
                {stat}
              </span>
            ))}
          </div>
          {/* 샘플 책 카드 */}
          <div style={{ display: 'inline-block', background: 'var(--bg-surface)', borderRadius: 20, padding: '20px 32px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.5px' }}>
              &ldquo;Jin&rsquo;s February Adventures&rdquo;
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 1 }}>
              10 pages · Created by Jin · February 2026
            </p>
          </div>
        </div>
      </section>

      {/* ─── Built on Research ─── */}
      <section
        ref={researchAnim.ref}
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          background: 'var(--bg-surface)',
          transform: researchAnim.visible ? 'none' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 16 }}>
              Built on Research
            </p>
            <h2 className="font-display font-black" style={{
              fontSize: 'clamp(28px, 4.5vw, 52px)',
              letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic',
              color: 'var(--text)', marginBottom: 20,
            }}>
              Not a new method. Proven science, wrapped in creativity.
            </h2>
            <p style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 640, margin: '0 auto' }}>
              We didn&apos;t invent a new way to teach English. We took what decades of research already proved — and wrapped it in something a child would actually want to do: make their own storybook.
            </p>
          </div>
          {/* 3개 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px,100%),1fr))', gap: 24, marginBottom: 48 }}>
            {[
              {
                title: 'Words that stick',
                desc: "Every word in StoryPress is chosen from the same research-backed lists used in classrooms across New Zealand, Australia, the US, and the UK. Your child meets each word 14+ times — through stories, games, and their own creations — so it stays.",
              },
              {
                title: 'Stories, not drills',
                desc: "Children remember words far better when they meet them inside stories they care about. That's why every word in StoryPress lives inside a story your child helps create.",
              },
              {
                title: 'Made by them, not watched by them',
                desc: "Your child doesn't just listen or tap. They build a story, colour the scene, and see their work become a real page in a real book. That's active creation — and it's what makes the difference.",
              },
            ].map((card, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 24, padding: 'clamp(24px, 3vw, 36px)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.5px' }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: 1 }}>
            Built on the Science of Reading — the same research behind New Zealand&apos;s new classroom literacy programme.
          </p>
        </div>
      </section>

      {/* ─── Our Story ─── */}
      <section style={{ padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 16 }}>
          Our Story
        </p>
        <h2 className="font-display font-black" style={{
          fontSize: 'clamp(28px, 4.5vw, 52px)',
          letterSpacing: '-2px', lineHeight: 1.1, fontStyle: 'italic',
          color: 'var(--text)', marginBottom: 32,
        }}>
          Built by a mom. For her daughter.
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 17px)', color: 'var(--text-secondary)', lineHeight: 1.85, marginBottom: 24 }}>
          When Jin moved from Seoul to Auckland at age 4, English was a wall. We tried apps, tutors, YouTube, playgroups. Some helped. Most didn&apos;t stick.
        </p>
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 17px)', color: 'var(--text-secondary)', lineHeight: 1.85, marginBottom: 40 }}>
          StoryPress was born from that journey — the frustration, the breakthroughs, and the moment Jin said &ldquo;I made a story!&rdquo; for the first time.
        </p>
        <blockquote style={{ borderLeft: '3px solid #F59E42', paddingLeft: 24, textAlign: 'left', margin: '0 auto', maxWidth: 560 }}>
          <p style={{ fontSize: 'clamp(15px, 1.8vw, 17px)', fontStyle: 'italic', color: 'var(--text)', lineHeight: 1.75, marginBottom: 12 }}>
            &ldquo;We didn&apos;t invent a new teaching method. We took what research already proved — and wrapped it in something a 4-year-old would actually want to do: create her own storybook.&rdquo;
          </p>
          <cite style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontStyle: 'normal' }}>
            — Penny &amp; Yussi, StoryPress
          </cite>
        </blockquote>
      </section>

      {/* ─── 인용문 ─── */}
      <section
        ref={quoteAnim.ref}
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          textAlign: 'center',
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
              My child creates a new story page every day —<br />
              and can&apos;t wait to show me what she made.
            </p>
            <cite style={{
              fontSize: 12, fontWeight: 900, letterSpacing: 3,
              textTransform: 'uppercase', color: 'var(--text-tertiary)',
              fontStyle: 'normal',
            }}>
              — Auckland ESOL Family
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
        className="sp-cta-section"
        style={{
          padding: 'clamp(64px, 7vw, 96px) clamp(24px, 4vw, 80px)',
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
            Your Child&apos;s First Book Is Waiting
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
            Your child&apos;s first English storybook is one sign-up away.<br />
            We&apos;ll let you know the moment StoryPress is ready.
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
      <div className="sp-cta-section" style={{
        padding: '32px clamp(24px, 4vw, 80px)',
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
