import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import type { Magazine, Article } from '@/lib/types';
import { ChevronLeft } from 'lucide-react';
import PageThumbnail from './PageThumbnail';

interface Props {
  magazine: Magazine;
  articles: Article[];
  pageMap: Record<number, number>;
}

const DETAIL_CSS = `
.mid-back {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: "Inter", sans-serif;
  font-size: 11px; font-weight: 600; letter-spacing: 0.2em;
  text-transform: uppercase; color: #8A6B4F;
  text-decoration: none;
  padding: 6px 0;
  margin-bottom: clamp(20px, 3vw, 28px);
}
.mid-back:hover { opacity: 0.72; }

.mid-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(24px, 5vw, 48px);
  align-items: center;
}
@media (min-width: 768px) {
  .mid-hero {
    grid-template-columns: 360px 1fr;
    gap: clamp(40px, 6vw, 80px);
  }
}

.mid-cover {
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  aspect-ratio: 42 / 55;
  position: relative;
  background: #FAF8F5;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  overflow: hidden;
}
@media (min-width: 768px) {
  .mid-cover {
    max-width: 360px;
    margin: 0;
  }
}

.mid-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
@media (min-width: 768px) {
  .mid-info {
    text-align: left;
    align-items: flex-start;
  }
}

.mid-issue-label {
  font-family: "Inter", sans-serif;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.3em; text-transform: uppercase;
  color: #9B9590;
  margin: 0;
}

.mid-title {
  font-family: "Playfair Display", serif;
  font-weight: 900;
  font-size: clamp(28px, 4.5vw, 44px);
  line-height: 1.05;
  color: #1A1A1A;
  margin: 0;
}

.mid-sub {
  font-family: "Inter", sans-serif;
  font-size: 14px; font-weight: 400;
  color: #9B9590;
  margin: 0;
}

.mid-meta-row {
  display: flex; gap: 14px; align-items: center; flex-wrap: wrap;
  justify-content: center;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  color: #1A1A1A;
}
@media (min-width: 768px) {
  .mid-meta-row { justify-content: flex-start; }
}
.mid-meta-row .dot { width: 3px; height: 3px; background: #9B9590; border-radius: 50%; flex-shrink: 0; }
.mid-editor { color: #9B9590; }

.mid-cta {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px;
  margin-top: 12px;
  padding: 12px 28px;
  background: #8A6B4F;
  color: #FDFCFA;
  font-family: "Inter", sans-serif;
  font-size: 14px; font-weight: 500;
  letter-spacing: 0.05em;
  text-decoration: none;
  border-radius: 6px;
  transition: opacity 0.15s ease;
}
.mid-cta:hover { opacity: 0.88; }

.mid-pdf-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: #9B9590;
  text-decoration: none;
  padding: 4px 0;
  transition: color 0.15s;
}
.mid-pdf-link:hover { color: #1A1A1A; text-decoration: underline; }

.mid-section-label {
  font-family: "Inter", sans-serif;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.35em; text-transform: uppercase;
  color: #9B9590;
  margin: 0 0 24px;
  display: flex; align-items: center; gap: 14px;
}
.mid-section-label::after {
  content: ''; flex: 1; height: 1px; background: #EDE9E3;
}

.mid-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
@media (min-width: 600px) {
  .mid-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
}
@media (min-width: 960px) {
  .mid-grid { grid-template-columns: 1fr 1fr 1fr; gap: 28px; }
}

.mid-card {
  display: block;
  background: #FDFCFA;
  border-radius: 6px;
  overflow: hidden;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.mid-card:hover { opacity: 0.92; transform: scale(1.01); }

.mid-thumb {
  position: relative;
  aspect-ratio: 42 / 55;
  background: #FAF8F5;
  overflow: hidden;
}

.mid-card-meta {
  padding: 16px 18px 20px;
  display: flex; flex-direction: column; gap: 6px;
}
.mid-kicker {
  font-family: "Inter", sans-serif;
  font-size: 9px; font-weight: 600;
  letter-spacing: 0.3em; text-transform: uppercase;
  color: #8A6B4F;
  margin: 0;
}
.mid-card-title {
  font-family: "Playfair Display", serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 1.25;
  color: #1A1A1A;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mid-card-author {
  font-family: "Inter", sans-serif;
  font-size: 12px; font-weight: 400;
  color: #9B9590;
  margin: 0;
}

.mid-footer-cta {
  margin-top: clamp(40px, 6vw, 72px);
  text-align: center;
}
`;

function kickerFor(tpl?: string | null): string {
  switch (tpl) {
    case 'text-only':
    case 'essay': return 'Essay';
    case 'photo-hero': return 'Feature';
    case 'photo-essay': return 'Photo Essay';
    case 'split':
    case 'story-2': return 'Story';
    case 'cover': return 'Cover Story';
    case 'pull-quote': return 'Pull Quote';
    case 'directory': return 'Directory';
    case 'sidebar': return 'Feature';
    case 'title-card': return 'Opener';
    case 'classic':
    default: return 'Article';
  }
}

export default function MagazineIssueDetail({ magazine, articles, pageMap }: Props) {
  const mainArticles = articles
    .filter(a => a.article_type === 'article' || !a.article_type)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const articleCount = mainArticles.length;

  return (
    <main
      style={{
        background: '#FAF8F5',
        minHeight: '100vh',
        padding: 'clamp(24px, 5vw, 56px) 20px 64px',
        boxSizing: 'border-box',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: DETAIL_CSS }} />

      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* 뒤로가기 */}
        <Link href="/magazine" className="mid-back">
          <ChevronLeft size={14} />
          <span>Back to Shelf</span>
        </Link>

        {/* 표지 히어로 */}
        <section className="mid-hero">
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
              className="mid-cover"
              style={{ background: magazine.bg_color || '#FAF8F5' }}
            >
              {magazine.image_url ? (
                <SafeImage
                  src={magazine.image_url}
                  alt={magazine.title}
                  fill
                  sizes="(max-width: 767px) 280px, 360px"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 900, fontSize: 48,
                    color: '#9B9590', opacity: 0.4,
                  }}
                >
                  MHJ
                </div>
              )}
            </div>
          </div>

          <div className="mid-info">
            <p className="mid-issue-label">
              {magazine.month_name} {magazine.year} · Issue
            </p>
            <h1 className="mid-title">{magazine.title}</h1>
            <p className="mid-sub">Mairangi Bay · Auckland · New Zealand</p>
            <div className="mid-meta-row">
              <span>{articleCount} article{articleCount !== 1 ? 's' : ''}</span>
              {magazine.editor && (
                <>
                  <span className="dot" aria-hidden />
                  <span className="mid-editor">Editor · {magazine.editor}</span>
                </>
              )}
            </div>
            <Link href={`/magazine/${magazine.id}?page=1`} className="mid-cta">
              Start Reading →
            </Link>
            {magazine.pdf_url && (
              <a
                href={magazine.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mid-pdf-link"
              >
                ↓ Download Full Issue (PDF)
              </a>
            )}
          </div>
        </section>

        {/* 내지 그리드 */}
        {mainArticles.length > 0 && (
          <section style={{ marginTop: 'clamp(48px, 7vw, 80px)' }}>
            <h2 className="mid-section-label">
              <span>Inside This Issue</span>
            </h2>

            <div className="mid-grid">
              {/* Cover 페이지 썸네일 */}
              <Link
                href={`/magazine/${magazine.id}?page=1`}
                className="mid-card"
              >
                <div className="mid-thumb">
                  <PageThumbnail pageType="cover" magazine={magazine} />
                </div>
                <div className="mid-card-meta">
                  <p
                    className="mid-kicker"
                    style={{ color: magazine.accent_color || '#8A6B4F' }}
                  >
                    Cover
                  </p>
                  <h3 className="mid-card-title">{magazine.title}</h3>
                  <p className="mid-card-author">{magazine.month_name} {magazine.year}</p>
                </div>
              </Link>

              {/* Contents (TOC) 페이지 썸네일 */}
              <Link
                href={`/magazine/${magazine.id}?page=2`}
                className="mid-card"
              >
                <div className="mid-thumb">
                  <PageThumbnail pageType="toc" magazine={magazine} articles={mainArticles} />
                </div>
                <div className="mid-card-meta">
                  <p
                    className="mid-kicker"
                    style={{ color: magazine.accent_color || '#8A6B4F' }}
                  >
                    Contents
                  </p>
                  <h3 className="mid-card-title">Inside This Issue</h3>
                  <p className="mid-card-author">{articleCount} article{articleCount !== 1 ? 's' : ''}</p>
                </div>
              </Link>

              {/* 기사 페이지 썸네일 */}
              {mainArticles.map((art, i) => {
                const pageNum = pageMap[art.id] ?? (3 + i);
                return (
                  <Link
                    key={art.id}
                    href={`/magazine/${magazine.id}?page=${pageNum}`}
                    className="mid-card"
                  >
                    <div className="mid-thumb">
                      <PageThumbnail pageType="article" magazine={magazine} article={art} />
                    </div>
                    <div className="mid-card-meta">
                      <p
                        className="mid-kicker"
                        style={{ color: magazine.accent_color || '#8A6B4F' }}
                      >
                        {art.kicker?.trim() || kickerFor(art.template)}
                      </p>
                      <h3 className="mid-card-title">{art.title || 'Untitled'}</h3>
                      <p className="mid-card-author">{art.author || 'MHJ'}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 하단 CTA */}
            <div className="mid-footer-cta">
              <Link href={`/magazine/${magazine.id}?page=1`} className="mid-cta">
                Read from the start →
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
