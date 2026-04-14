'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import Link from 'next/link';
import {
  BookOpen, RefreshCw, Users, Sparkles, ChevronDown,
  Clock, BookMarked, Calendar, Brain, Pencil, FlaskConical,
  Star, Heart,
} from 'lucide-react';
import StoryPressFAQ from '@/components/StoryPressFAQ';

interface Props {
  title: string;
  description: string;
  heroImageUrl: string;
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

const LIBRARY_STATS = [
  {
    icon: Clock,
    color: '#F59E42',
    bg: '#FFF7ED',
    number: '10',
    unit: 'min',
    label: 'a day',
    desc: 'Short enough for any schedule. Long enough to make real progress.',
  },
  {
    icon: BookMarked,
    color: '#6D7AFA',
    bg: '#EEF2FF',
    number: '40+',
    unit: '',
    label: 'words per book',
    desc: 'Each storybook contains 40 carefully chosen, research-backed vocabulary words.',
  },
  {
    icon: Calendar,
    color: '#10B981',
    bg: '#ECFDF5',
    number: '10',
    unit: 'days',
    label: 'to a real book',
    desc: 'Ten daily pages become one finished storybook — with your child\'s name on the cover.',
  },
];

const RESEARCH_CARDS = [
  {
    icon: Brain,
    color: '#6D7AFA',
    bg: '#EEF2FF',
    title: 'Words that stick',
    desc: "Every word in StoryPress is chosen from the same research-backed lists used in classrooms across New Zealand, Australia, the US, and the UK. Your child meets each word 14+ times — through stories, games, and their own creations — so it stays.",
  },
  {
    icon: BookOpen,
    color: '#F59E42',
    bg: '#FFF7ED',
    title: 'Stories, not drills',
    desc: "Children remember words far better when they meet them inside stories they care about. That's why every word in StoryPress lives inside a story your child helps create.",
  },
  {
    icon: Pencil,
    color: '#10B981',
    bg: '#ECFDF5',
    title: 'Made by them, not watched by them',
    desc: "Your child doesn't just listen or tap. They build a story, colour the scene, and see their work become a real page in a real book. That's active creation — and it's what makes the difference.",
  },
];

export default function StoryPressClient({ title, description, heroImageUrl }: Props) {
  const [hoverFeature, setHoverFeature] = useState<number | null>(null);
  const [hoverResearch, setHoverResearch] = useState<number | null>(null);

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
            style={{ fontSize: 'clamp(56px, 10vw, 120px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: -4, lineHeight: 0.88, color: 'var(--text)', marginBottom: 28, maxWidth: 800 }}
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
              href="https://app.mhj.nz"
              onClick={() => trackEvent('cta_click', { location: 'hero' })}
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

      <div className="sp-divider" />

      {/* ─── Features (Why StoryPress) — 데스크탑 4열 ─── */}
      <section
        id="why-storypress"
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          maxWidth: 1320, margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: 64, textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 16 }}>
            Why StoryPress
          </p>
          <h2 className="font-display font-black" style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic',
            color: 'var(--text)',
          }}>
            Why parents choose StoryPress
          </h2>
        </div>

        {/* 4열 그리드 (tablet 2×2, mobile 1열) */}
        <div className="sp-grid-4">
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
                  borderRadius: 20,
                  padding: 'clamp(24px, 2.5vw, 36px)',
                  cursor: 'default',
                  opacity: isHovered ? 0.95 : 1,
                  transform: isHovered ? 'scale(1.02)' : 'none',
                  boxShadow: isHovered
                    ? '0 20px 48px rgba(0,0,0,0.10)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Icon size={22} color={f.color} />
                </div>

                {/* 숫자 강조 (첫 번째 카드) */}
                {f.highlight ? (
                  <div style={{ marginBottom: 12 }}>
                    <span
                      className="font-display"
                      style={{
                        fontSize: 'clamp(40px, 5vw, 56px)',
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
                    fontSize: 17, fontWeight: 900, color: 'var(--text)',
                    letterSpacing: '-0.5px', marginBottom: 12,
                  }}>
                    {f.title}
                  </h3>
                )}
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="sp-divider" />

      {/* ─── How It Works ─── */}
      <section
        className="sp-steps-bg"
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
        }}
      >
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ marginBottom: 64, textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 16 }}>
              Three steps to a real storybook
            </p>
            <h2 className="font-display font-black" style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
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
                  borderRadius: 20,
                  padding: 'clamp(32px, 4vw, 48px)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
              >
                {/* 번호만 — 배경 장식 숫자 없음 */}
                <p className="font-display" style={{
                  fontSize: 'clamp(40px, 5vw, 56px)',
                  fontWeight: 900, fontStyle: 'italic',
                  letterSpacing: -3, lineHeight: 1,
                  color: '#F59E42',
                  marginBottom: 20,
                }}>
                  {step.num}
                </p>
                <h3 style={{
                  fontSize: 20, fontWeight: 900, color: 'var(--text)',
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
          </p>
        </div>
      </section>

      <div className="sp-divider" />

      {/* ─── A Growing Library ─── */}
      <section
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          background: 'var(--bg)',
        }}
      >
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: '#CBD5E1', textTransform: 'uppercase', marginBottom: 16 }}>
              A Growing Library
            </p>
            <h2 className="font-display font-black" style={{
              fontSize: 'clamp(28px, 4.5vw, 52px)',
              letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic',
              color: 'var(--text)', marginBottom: 20,
            }}>
              A growing library of books they made themselves
            </h2>
            <p style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 600, margin: '0 auto' }}>
              Every day, your child creates a new story page. After 10 days, all the pages come together into a finished book — with their name right there on the cover. Then a new story begins.
            </p>
          </div>

          {/* 통계 3카드 — 아이콘 + 큰 숫자 + 설명 */}
          <div className="sp-grid-3" style={{ marginBottom: 56 }}>
            {LIBRARY_STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 20,
                  padding: 'clamp(28px, 3vw, 40px)',
                  textAlign: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: stat.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <Icon size={24} color={stat.color} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                    <span className="font-display" style={{
                      fontSize: 'clamp(40px, 5vw, 64px)',
                      fontWeight: 900, fontStyle: 'italic',
                      letterSpacing: -3, lineHeight: 1,
                      color: stat.color,
                    }}>
                      {stat.number}
                    </span>
                    {stat.unit && (
                      <span style={{ fontSize: 18, fontWeight: 900, color: stat.color }}>{stat.unit}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                    {stat.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 샘플 책 카드들 */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { title: "Jin's February Adventures", pages: 10, month: 'February 2026', rotate: '-3deg', color: '#FFF7ED', border: '#FED7AA' },
              { title: "Lily's Spring Stories", pages: 10, month: 'March 2026', rotate: '1.5deg', color: '#EEF2FF', border: '#C7D2FE' },
              { title: "Mia's Summer Garden", pages: 10, month: 'April 2026', rotate: '-1deg', color: '#ECFDF5', border: '#A7F3D0' },
            ].map((book, i) => (
              <div key={i} style={{
                background: book.color,
                border: `1px solid ${book.border}`,
                borderRadius: 16,
                padding: '20px 28px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                transform: `rotate(${book.rotate})`,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                minWidth: 200,
                cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'rotate(0deg) scale(1.03)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.14)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = `rotate(${book.rotate})`;
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Star size={14} color="#F59E42" fill="#F59E42" />
                  <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: '#F59E42' }}>Finished Book</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.3px' }}>
                  &ldquo;{book.title}&rdquo;
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 1 }}>
                  {book.pages} pages · {book.month}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="sp-divider" />

      {/* ─── Built on Research — 데스크탑 3열 ─── */}
      <section
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
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
            <p style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 600, margin: '0 auto' }}>
              We didn&apos;t invent a new way to teach English. We took what decades of research already proved — and wrapped it in something a child would actually want to do: make their own storybook.
            </p>
          </div>

          {/* 3열 그리드 */}
          <div className="sp-grid-3" style={{ marginBottom: 48 }}>
            {RESEARCH_CARDS.map((card, i) => {
              const Icon = card.icon;
              const isHovered = hoverResearch === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoverResearch(i)}
                  onMouseLeave={() => setHoverResearch(null)}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 20,
                    padding: 'clamp(28px, 3vw, 40px)',
                    boxShadow: isHovered ? '0 16px 40px rgba(0,0,0,0.10)' : '0 2px 12px rgba(0,0,0,0.05)',
                    opacity: isHovered ? 0.95 : 1,
                    transform: isHovered ? 'scale(1.02)' : 'none',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: card.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                    <Icon size={22} color={card.color} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.5px' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Science of Reading 배지 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '12px 24px',
              borderRadius: 999,
              background: '#EEF2FF',
              border: '1px solid #C7D2FE',
            }}>
              <FlaskConical size={16} color="#6D7AFA" />
              <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: '#6D7AFA' }}>
                Built on the Science of Reading
              </span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                — the same research behind New Zealand&apos;s new classroom literacy programme
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="sp-divider" />

      {/* ─── Our Story — 2컬럼 레이아웃 ─── */}
      <section
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          background: 'linear-gradient(135deg, #FFFBF5 0%, #FFF0E8 100%)',
        }}
      >
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
          gap: 'clamp(40px, 6vw, 80px)',
          alignItems: 'center',
        }}>
          {/* 좌: 가족 일러스트 카드 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 메인 카드 */}
            <div style={{
              background: 'white',
              borderRadius: 24,
              padding: 32,
              boxShadow: '0 20px 60px rgba(245,158,66,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #FF8B5E, #F59E42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={22} color="white" fill="white" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 900, color: '#1A1A1A', margin: 0 }}>Penny &amp; Yussi</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, fontWeight: 600, letterSpacing: 1 }}>AUCKLAND, NEW ZEALAND</p>
                </div>
              </div>
              <p style={{ fontSize: 15, fontStyle: 'italic', color: '#64748B', lineHeight: 1.75, margin: 0 }}>
                &ldquo;We didn&apos;t invent a new teaching method. We took what research already proved — and wrapped it in something a 4-year-old would actually want to do: create her own storybook.&rdquo;
              </p>
            </div>

            {/* 보조 카드 */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { emoji: '🇰🇷', label: 'Seoul', sub: 'where we started' },
                { emoji: '🇳🇿', label: 'Auckland', sub: 'where we live' },
                { emoji: '📖', label: 'StoryPress', sub: 'what we built' },
              ].map((item, i) => (
                <div key={i} style={{
                  flex: 1,
                  background: 'white',
                  borderRadius: 16,
                  padding: '16px 12px',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{item.emoji}</div>
                  <p style={{ fontSize: 12, fontWeight: 900, color: '#1A1A1A', margin: 0, letterSpacing: '-0.3px' }}>{item.label}</p>
                  <p style={{ fontSize: 10, color: '#94A3B8', margin: 0, fontWeight: 600 }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 우: 텍스트 */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: '#F59E42', textTransform: 'uppercase', marginBottom: 20 }}>
              Our Story
            </p>
            <h2 className="font-display font-black" style={{
              fontSize: 'clamp(28px, 4.5vw, 52px)',
              letterSpacing: '-2px', lineHeight: 1.1, fontStyle: 'italic',
              color: 'var(--text)', marginBottom: 28,
            }}>
              Built by a mom.<br />For her daughter.
            </h2>
            <p style={{ fontSize: 'clamp(15px, 1.8vw, 17px)', color: 'var(--text-secondary)', lineHeight: 1.85, marginBottom: 20 }}>
              When Jin moved from Seoul to Auckland at age 4, English was a wall. We tried apps, tutors, YouTube, playgroups. Some helped. Most didn&apos;t stick.
            </p>
            <p style={{ fontSize: 'clamp(15px, 1.8vw, 17px)', color: 'var(--text-secondary)', lineHeight: 1.85, marginBottom: 32 }}>
              StoryPress was born from that journey — the frustration, the breakthroughs, and the moment Jin said &ldquo;I made a story!&rdquo; for the first time.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {['Immigrant family', 'ESOL experience', 'Research-based', 'Built with love'].map((tag, i) => (
                <span key={i} style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: 6,
                  background: 'rgba(245,158,66,0.12)',
                  color: '#B45309',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="sp-divider" />

      {/* ─── 인용문 ─── */}
      <section
        style={{
          padding: 'clamp(56px, 6vw, 80px) clamp(24px, 4vw, 80px)',
          textAlign: 'center',
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

      <div className="sp-divider" />

      {/* ─── FAQ ─── */}
      <StoryPressFAQ />

      {/* ─── 대기자 등록 폼 ─── */}
      <section
        id="storypress-signup"
        className="sp-cta-section"
        style={{
          padding: 'clamp(64px, 7vw, 96px) clamp(24px, 4vw, 80px)',
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
            Your Child&apos;s First Book Is Waiting
          </h2>
          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)',
            color: 'rgba(255,255,255,0.45)',
            fontWeight: 500, lineHeight: 1.7, marginBottom: 48,
          }}>
            Start your free 10-day adventure today.<br />
            No credit card needed. Just stories, words, and a real book.
          </p>

          <a
            href="https://app.mhj.nz"
            onClick={() => trackEvent('cta_click', { location: 'bottom' })}
            className="font-black uppercase"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '18px 48px', borderRadius: 999,
              background: 'white', color: '#0A0A0A', border: 'none',
              fontSize: 12, letterSpacing: 3,
              textDecoration: 'none',
              boxShadow: '0 16px 32px rgba(0,0,0,0.15)',
              transition: 'all 0.2s',
            }}
          >
            Start Free Adventure
          </a>

          <p style={{ marginTop: 32, fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
            Free to try · Cancel anytime
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
          ← Back to MHJ
        </Link>
      </div>

    </div>
  );
}
