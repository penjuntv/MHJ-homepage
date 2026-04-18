'use client';

import Link from 'next/link';
import type { Magazine } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';
import PageThumbnail from '@/components/magazine/PageThumbnail';

interface Props {
  magazines: Magazine[];
  magazineTitle?: string;
  magazineHint?: string;
}

function isLightColor(hex: string): boolean {
  const c = (hex || '').replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

export default function MagazineShelf({ magazines, magazineTitle, magazineHint }: Props) {
  return (
    <section className="ms-section">
      <style dangerouslySetInnerHTML={{ __html: SHELF_CSS }} />
      <div className="ms-container">
        <header className="ms-header">
          <h1 className="ms-heading">{magazineTitle || 'Magazine'}</h1>
          {magazineHint && <p className="ms-hint">{magazineHint}</p>}
        </header>

        {magazines.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* 데스크톱: 책장 bookshelf */}
            <div className="ms-bookshelf" aria-label="Magazine bookshelf">
              <div className="ms-bookshelf-books">
                {magazines.map((m, i) => (
                  <BookSpine key={m.id} magazine={m} isLatest={i === 0} />
                ))}
              </div>
            </div>

            {/* 모바일: 3:4 카드 2열 그리드 폴백 */}
            <div className="ms-grid">
              {magazines.map((m, i) => (
                <ShelfCard key={m.id} magazine={m} isLatest={i === 0} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function BookSpine({ magazine, isLatest }: { magazine: Magazine; isLatest: boolean }) {
  const spineColor = magazine.bg_color ?? '#3a3025';
  const isLight = isLightColor(spineColor);
  const ink = isLight ? '#1A1A1A' : '#FDFCFA';

  return (
    <Link
      href={`/magazine/${magazine.id}`}
      className="shelf-book"
      style={{
        ['--spine-color' as string]: spineColor,
        ['--spine-ink' as string]: ink,
      }}
      onClick={() => {
        trackEvent('magazine_open', {
          issue_id: magazine.id,
          issue_title: magazine.title,
        });
      }}
      aria-label={`Open ${magazine.title}, ${magazine.month_name} ${magazine.year}`}
    >
      {isLatest && <span className="shelf-book-badge">Latest</span>}

      {/* 기본: 책등 */}
      <div className="shelf-book-spine">
        <span className="shelf-book-spine-top">MHJ</span>
        <span className="shelf-book-spine-text">{magazine.title}</span>
        <span className="shelf-book-spine-date">
          {(magazine.month_name ?? '').toUpperCase()} {magazine.year}
        </span>
      </div>

      {/* Hover: 완성본 표지 (MHJ 로고 + 타이틀 + 발행월) */}
      <div className="shelf-book-cover">
        <PageThumbnail pageType="cover" magazine={magazine} />
      </div>
    </Link>
  );
}

function ShelfCard({ magazine, isLatest }: { magazine: Magazine; isLatest: boolean }) {
  return (
    <Link
      href={`/magazine/${magazine.id}`}
      className="ms-card"
      onClick={() => {
        trackEvent('magazine_open', {
          issue_id: magazine.id,
          issue_title: magazine.title,
        });
      }}
    >
      <div
        className="ms-cover"
        style={{ background: magazine.bg_color ?? '#FAF8F5' }}
      >
        {isLatest && <span className="ms-badge">Latest</span>}
        {/* 완성본 표지 (MHJ 로고 + 타이틀 + 발행월) */}
        <PageThumbnail pageType="cover" magazine={magazine} />
      </div>
      <div className="ms-meta">
        <h3 className="ms-card-title">{magazine.title || 'Untitled'}</h3>
        <p className="ms-card-date">
          {magazine.month_name} {magazine.year}
        </p>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="ms-empty">
      <span className="ms-empty-kicker">Magazine</span>
      <h2 className="ms-empty-title">Coming Soon</h2>
      <p className="ms-empty-desc">새로운 이슈를 준비 중입니다.</p>
    </div>
  );
}

const SHELF_CSS = `
.ms-section {
  background: #FAF8F5;
  padding: clamp(48px, 6vw, 88px) 20px 64px;
  min-height: 70vh;
  box-sizing: border-box;
}
.ms-container {
  max-width: 1080px;
  margin: 0 auto;
}

.ms-header {
  text-align: center;
  margin-bottom: clamp(32px, 4vw, 48px);
}
.ms-heading {
  font-family: "Playfair Display", serif;
  font-weight: 900;
  font-size: clamp(28px, 4.5vw, 40px);
  color: #1A1A1A;
  letter-spacing: -0.01em;
  line-height: 1.05;
  margin: 0 0 12px;
}
.ms-hint {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #9B9590;
  margin: 0;
}

/* ── 데스크톱: Bookshelf ── */
.ms-bookshelf {
  display: none;
  position: relative;
  padding: 28px 40px 12px;
  background:
    linear-gradient(180deg, #5B4426 0%, #6E5433 45%, #4A361E 100%);
  box-shadow:
    inset 0 6px 12px rgba(0,0,0,0.45),
    inset 0 -2px 0 rgba(0,0,0,0.55);
  perspective: 1800px;
  transform-style: preserve-3d;
  overflow: visible;
}
.ms-bookshelf::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    90deg,
    rgba(0,0,0,0.06) 0px,
    rgba(0,0,0,0.06) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  mix-blend-mode: overlay;
  opacity: 0.45;
}
.ms-bookshelf::after {
  /* 바닥 선반 depth */
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -6px;
  height: 6px;
  background: linear-gradient(180deg, #3a2b17 0%, #1e1408 100%);
  box-shadow: 0 2px 6px rgba(0,0,0,0.35);
}
.ms-bookshelf-books {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  min-height: 360px;
  overflow-x: auto;
  overflow-y: visible;
  padding: 10px 0 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.3) transparent;
}
.ms-bookshelf-books::-webkit-scrollbar { height: 4px; }
.ms-bookshelf-books::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.3); border-radius: 2px; }

.shelf-book {
  position: relative;
  width: 56px;
  height: 340px;
  background: var(--spine-color, #3a3025);
  flex-shrink: 0;
  text-decoration: none;
  color: var(--spine-ink, #FDFCFA);
  cursor: pointer;
  display: block;
  transform-origin: bottom center;
  transition: width 360ms cubic-bezier(.2,.8,.2,1),
              transform 360ms cubic-bezier(.2,.8,.2,1),
              box-shadow 360ms ease;
  box-shadow:
    inset -1px 0 0 rgba(255,255,255,0.08),
    2px 0 4px rgba(0,0,0,0.25);
}
.shelf-book:hover,
.shelf-book:focus-visible {
  width: 260px;
  transform: translateY(-14px) rotateY(-2deg) translateZ(8px);
  z-index: 2;
  box-shadow:
    0 24px 38px -12px rgba(0,0,0,0.55),
    0 4px 8px rgba(0,0,0,0.3);
  outline: none;
}

.shelf-book-spine {
  position: absolute;
  inset: 0;
  padding: 14px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  transition: opacity 180ms ease;
}
.shelf-book:hover .shelf-book-spine,
.shelf-book:focus-visible .shelf-book-spine {
  opacity: 0;
}
.shelf-book-spine-top {
  font-family: "Playfair Display", serif;
  font-weight: 900;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--spine-ink, #FDFCFA);
  opacity: 0.82;
}
.shelf-book-spine-text {
  writing-mode: vertical-rl;
  /* ISO 6357 / BS 6738: top-to-bottom (제목 첫 글자가 책등 상단에) */
  font-family: "Playfair Display", serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.04em;
  line-height: 1;
  color: var(--spine-ink, #FDFCFA);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 240px;
}
.shelf-book-spine-date {
  font-family: "Inter", sans-serif;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--spine-ink, #FDFCFA);
  opacity: 0.55;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.shelf-book-badge {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  background: #FDFCFA;
  color: #8A6B4F;
  font-family: "Inter", sans-serif;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  white-space: nowrap;
}

.shelf-book-cover {
  position: absolute;
  inset: 0;
  background: var(--spine-color, #3a3025);
  overflow: hidden;
  opacity: 0;
  transition: opacity 200ms ease 120ms;
}
.shelf-book:hover .shelf-book-cover,
.shelf-book:focus-visible .shelf-book-cover {
  opacity: 1;
}
.shelf-book-cover img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.shelf-book-cover-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  color: var(--spine-ink, #FDFCFA);
}

/* ── 모바일: 2열 3:4 카드 그리드 폴백 ── */
.ms-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (min-width: 600px) {
  .ms-grid { gap: 20px; }
}

.ms-card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 200ms ease;
}
.ms-card:hover { transform: scale(1.02); }
.ms-card:hover .ms-cover { box-shadow: 0 8px 24px rgba(0,0,0,0.15); }

.ms-cover {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #FAF8F5;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transition: box-shadow 200ms ease;
}
.ms-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  background: #8A6B4F;
  color: #FDFCFA;
  font-family: "Inter", sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 2px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.ms-cover-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #1A1A1A;
  text-align: center;
}
.ms-placeholder-mhj {
  font-family: "Playfair Display", serif;
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1;
}
.ms-placeholder-title {
  font-family: "Inter", sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.65;
}

.ms-meta { padding: 14px 4px 0; }
.ms-card-title {
  font-family: "Playfair Display", serif;
  font-weight: 700;
  font-size: 16px;
  color: #1A1A1A;
  line-height: 1.25;
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ms-card-date {
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #9B9590;
  margin: 0;
}

/* ── 반응형 분기 ── */
@media (min-width: 768px) {
  .ms-bookshelf { display: block; }
  .ms-grid { display: none; }
}

/* ── 다크모드 (월넛) ── */
html.dark .ms-section { background: #1A1A1A; }
html.dark .ms-heading { color: #FDFCFA; }
html.dark .ms-hint { color: rgba(253,252,250,0.55); }
html.dark .ms-bookshelf {
  background: linear-gradient(180deg, #2a1f12 0%, #3a2a18 50%, #1e1408 100%);
  box-shadow:
    inset 0 6px 12px rgba(0,0,0,0.7),
    inset 0 -2px 0 rgba(0,0,0,0.85);
}
html.dark .ms-bookshelf::after {
  background: linear-gradient(180deg, #0e0805 0%, #000 100%);
}
html.dark .shelf-book { filter: brightness(0.94); }
html.dark .ms-card-title { color: #FDFCFA; }
html.dark .ms-card-date { color: rgba(253,252,250,0.55); }
html.dark .ms-empty-title { color: #FDFCFA; }
html.dark .ms-empty-desc { color: rgba(253,252,250,0.55); }

/* ── Empty ── */
.ms-empty {
  text-align: center;
  padding: clamp(48px, 8vw, 96px) 20px;
}
.ms-empty-kicker {
  display: block;
  font-family: "Inter", sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.35em;
  color: #8A6B4F;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.ms-empty-title {
  font-family: "Playfair Display", serif;
  font-weight: 900;
  font-style: italic;
  font-size: clamp(28px, 4vw, 40px);
  color: #1A1A1A;
  margin: 0 0 10px;
}
.ms-empty-desc {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: #9B9590;
  margin: 0;
}
`;
