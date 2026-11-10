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
            {/* 데스크톱: 책장 bookshelf — 책등 줄 + 끝에 최신 호를 표지가 보이게 세워 둔다(face-out).
                2026-11-11(docs/specs/magazine-shelf-2026-11.md): 선반 66% 가 비어 있었고, 표지는 호버해야만 보여
                마우스 없는 태블릿은 표지를 볼 수 없었다. */}
            <div className="ms-bookshelf" aria-label="Magazine bookshelf">
              <div className="ms-bookshelf-books">
                {magazines.map((m) => (
                  <BookSpine key={m.id} magazine={m} />
                ))}
                <FaceOutCover magazine={magazines[0]} />
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

/** 선반 끝에 세워 둔 최신 호 — 표지(42:55)를 자르지 않고 336×440(책 높이)으로. "Latest" 배지는 여기에만. */
function FaceOutCover({ magazine }: { magazine: Magazine }) {
  return (
    <Link
      href={`/magazine/${magazine.id}`}
      className="shelf-faceout"
      onClick={() => {
        trackEvent('magazine_open', {
          issue_id: magazine.id,
          issue_title: magazine.title,
        });
      }}
      aria-label={`Latest issue: ${magazine.title}, ${magazine.month_name} ${magazine.year}`}
    >
      <span className="shelf-faceout-badge">Latest</span>
      <PageThumbnail pageType="cover" magazine={magazine} />
    </Link>
  );
}

function BookSpine({ magazine }: { magazine: Magazine }) {
  const spineColor = magazine.bg_color ?? '#3a3025';
  // 책등 글씨는 배경 밝기와 무관하게 검정으로 통일 (2026-09 PeNnY 결정)
  const ink = '#1A1A1A';

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
      {/* 기본: 책등 ("Latest" 배지는 선반 끝에 세운 표지로 옮겼다 — 같은 호에 두 번 붙지 않게) */}
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
        {/* 이 페이지의 h1 은 서가 제목이다 — 카드가 h3 면 h2 를 건너뛴다(axe heading-order). */}
        <h2 className="ms-card-title">{magazine.title || 'Untitled'}</h2>
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
/* 색은 테마 변수(2026-11-11): 예전 #FAF8F5·#1A1A1A 직접 지정 + html.dark 덮어쓰기는 다크에서
   서가 구역(#1A1A1A)과 페이지(#0A0A0A)가 띠처럼 갈렸다. */
.ms-section {
  background: var(--bg-surface);
  padding: clamp(48px, 6vw, 88px) 20px 64px;
  min-height: 70vh;
  box-sizing: border-box;
}
.ms-container {
  max-width: 1400px;
  margin: 0 auto;
}

.ms-header {
  text-align: center;
  margin-bottom: clamp(32px, 4vw, 48px);
}
.ms-heading {
  font-family: "Playfair Display", "Noto Sans KR", serif;
  font-weight: 900;
  font-size: clamp(28px, 4.5vw, 40px);
  color: var(--text);
  letter-spacing: -0.01em;
  line-height: 1.05;
  margin: 0 0 12px;
}
/* 안내 문구는 책등 호버 이야기라 마우스가 있는 768 이상에서만(모바일 카드·태블릿 터치엔 맞지 않는 말) */
.ms-hint {
  display: none;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--text-secondary);
  margin: 0;
}
@media (hover: hover) and (min-width: 768px) {
  .ms-hint { display: block; }
}

/* ── 데스크톱: Bookshelf ── */
.ms-bookshelf {
  display: none;
  position: relative;
  padding: 36px 52px 16px;
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
  left: 0; right: 0; bottom: -8px;
  height: 8px;
  background: linear-gradient(180deg, #3a2b17 0%, #1e1408 100%);
  box-shadow: 0 2px 6px rgba(0,0,0,0.35);
}
.ms-bookshelf-books {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  min-height: 468px;
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
  width: 72px;
  height: 440px;
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
  width: 338px;
  transform: translateY(-18px) rotateY(-2deg) translateZ(10px);
  z-index: 2;
  box-shadow:
    0 24px 38px -12px rgba(0,0,0,0.55),
    0 4px 8px rgba(0,0,0,0.3);
  outline: none;
}

.shelf-book-spine {
  position: absolute;
  inset: 0;
  padding: 18px 8px;
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
  font-family: "Playfair Display", "Noto Sans KR", serif;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--spine-ink, #FDFCFA);
  opacity: 0.82;
}
.shelf-book-spine-text {
  writing-mode: vertical-rl;
  /* ISO 6357 / BS 6738: top-to-bottom (제목 첫 글자가 책등 상단에) */
  font-family: "Playfair Display", "Noto Sans KR", serif;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.04em;
  line-height: 1;
  color: var(--spine-ink, #FDFCFA);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 312px;
}
.shelf-book-spine-date {
  font-family: "Inter", sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--spine-ink, #FDFCFA);
  /* 0.55 는 9px 에서 2.98~3.76:1 이었다(스파인 색이 호마다 달라 최악은 중간톤).
     --spine-ink 가 이미 배경 밝기에 따라 뒤집히므로, 알파만 올리면 양쪽 다 통과한다 — 0.85 → 6.4:1 이상. */
  opacity: 0.85;
  writing-mode: vertical-rl;
  /* ISO 6357 / BS 6738: top-to-bottom, 제목과 방향 통일 */
}

/* ── 선반 끝 최신 호 표지(face-out) — 42:55 그대로 336×440(책 높이), 자르지 않는다 ── */
.shelf-faceout {
  position: relative;
  display: block;
  /* 남는 폭이 모자라면(768 태블릿) 비율 그대로 작아진다 — 옆으로 밀려 잘리지 않게. 높이는 폭 × 55/42 */
  flex: 0 1 336px;
  min-width: 150px;
  margin-left: auto;          /* 책등 줄 끝, 선반 오른쪽으로 */
  margin-right: 12px;
  text-decoration: none;
  box-shadow: 0 18px 32px -14px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.25);
  transition: opacity 0.2s ease;
}
.shelf-faceout:hover,
.shelf-faceout:focus-visible { opacity: 0.92; outline: none; }
.shelf-faceout:focus-visible { box-shadow: 0 0 0 3px #FDFCFA, 0 18px 32px -14px rgba(0,0,0,0.55); }
.shelf-faceout-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  background: #8A6B4F;
  color: #FDFCFA;
  font-family: "Inter", sans-serif;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
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
  font-family: "Playfair Display", "Noto Sans KR", serif;
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
  font-family: "Playfair Display", "Noto Sans KR", serif;
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
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
  color: var(--text-secondary);
  margin: 0;
}

/* ── 반응형 분기 ── */
@media (min-width: 768px) {
  .ms-bookshelf { display: block; }
  .ms-grid { display: none; }
}

/* ── 다크모드 (월넛) — 바탕·글자는 위 변수가 맡고, 나무 선반만 덮어쓴다 ── */
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
  font-family: "Playfair Display", "Noto Sans KR", serif;
  font-weight: 900;
  font-style: italic;
  font-size: clamp(28px, 4vw, 40px);
  color: var(--text);
  margin: 0 0 10px;
}
.ms-empty-desc {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}
`;
