'use client';

import Link from 'next/link';
import { Rss } from 'lucide-react';

interface FooterProps {
  siteName?: string;
  siteSubtitle?: string;
  footerDescription?: string;
  contactLocation?: string;
  contactEmail?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialYoutube?: string;
  socialThreads?: string;
}

export default function Footer({
  siteName = 'MY MAIRANGI',
  siteSubtitle = 'Family Archive',
  footerDescription = '뉴질랜드 오클랜드 노스쇼어\n마이랑이 베이에서 기록하는\n우리 가족의 이야기',
  contactLocation = 'Mairangi Bay, Auckland',
  contactEmail,
  socialFacebook,
  socialYoutube,
  socialThreads,
}: FooterProps) {
  const descLines = footerDescription.split('\n');

  return (
    <footer style={{ background: '#111111', padding: '96px clamp(20px, 4vw, 40px) 48px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
          gap: '80px',
          maxWidth: '1400px',
          margin: '0 auto',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '80px',
        }}
      >
        {/* 브랜드 */}
        <div>
          <div
            className="font-display font-black uppercase type-h2"
            style={{
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '-2px',
              marginBottom: '24px',
            }}
          >
            {siteName}
          </div>
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: '1.8',
              fontWeight: 500,
            }}
          >
            {descLines.map((line, i) => (
              <span key={i}>{line}{i < descLines.length - 1 && <br />}</span>
            ))}
          </p>

        </div>

        {/* Explore */}
        <div>
          <div
            className="font-black uppercase"
            style={{
              fontSize: '10px',
              letterSpacing: '4px',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: '24px',
            }}
          >
            Explore
          </div>
          <div className="flex flex-col" style={{ gap: '12px' }}>
            {[
              { label: 'About',     href: '/about'      },
              { label: 'Magazine',  href: '/magazine'   },
              { label: 'Blog',      href: '/blog'       },
              { label: 'StoryPress',href: '/storypress' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-bold uppercase transition-colors duration-300 hover:text-white"
                style={{
                  fontSize: '14px',
                  letterSpacing: '3px',
                  color: 'rgba(255,255,255,0.4)',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <div
            className="font-black uppercase"
            style={{
              fontSize: '10px',
              letterSpacing: '4px',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: '24px',
            }}
          >
            Contact
          </div>
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <p className="font-bold" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
              📍 {contactLocation}
            </p>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="font-bold"
                style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
              >
                ✉️ {contactEmail}
              </a>
            )}
            {socialYoutube && (
              <a
                href={socialYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold"
                style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
              >
                📺 YouTube
              </a>
            )}
            {socialFacebook && (
              <a
                href={socialFacebook}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold"
                style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
              >
                📘 Facebook
              </a>
            )}
            {socialThreads && (
              <a
                href={socialThreads}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold"
                style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
              >
                🧵 Threads
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 하단 */}
      <div
        className="flex items-center justify-between"
        style={{
          maxWidth: '1400px',
          margin: '64px auto 0',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <p
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' }}
          className="font-black uppercase"
        >
          © 2026 My Mairangi Journal
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <p
            style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' }}
            className="font-black uppercase"
          >
            {siteSubtitle}
          </p>
          <Link href="/feed.xml" title="RSS Feed" className="rss-icon-link">
            <Rss size={14} />
          </Link>
        </div>
      </div>
    </footer>
  );
}

