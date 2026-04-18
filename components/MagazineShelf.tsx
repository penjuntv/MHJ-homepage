'use client';

import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import type { Magazine } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';

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
          <div className="ms-grid">
            {magazines.map((m, i) => (
              <ShelfCard key={m.id} magazine={m} isLatest={i === 0} />
            ))}
          </div>
        )}
      </div>
    </section>
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
        {magazine.image_url ? (
          <SafeImage
            src={magazine.image_url}
            alt={magazine.title}
            fill
            sizes="(max-width: 599px) 50vw, (max-width: 959px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="ms-cover-placeholder">
            <span className="ms-placeholder-mhj">MHJ</span>
            <span className="ms-placeholder-title">{magazine.title}</span>
          </div>
        )}
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
  margin-bottom: clamp(40px, 5vw, 56px);
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

.ms-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (min-width: 600px) {
  .ms-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}
@media (min-width: 960px) {
  .ms-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.ms-card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 200ms ease;
}
.ms-card:hover {
  transform: scale(1.02);
}
.ms-card:hover .ms-cover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

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

.ms-meta {
  padding: 14px 4px 0;
}
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
