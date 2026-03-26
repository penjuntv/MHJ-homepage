'use client';

import Link from 'next/link';
import { Rss } from 'lucide-react';

/* ── Inline SVG icons (20px, monochrome) ── */
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
}

function ThreadsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
      <path d="M17.5 8.3c-1-1.6-2.8-2.5-5-2.3-2.4.2-4.3 1.7-5 4-.5 1.6-.3 3.4.5 4.8 1.2 2 3.4 3 5.6 2.6 1.6-.3 2.8-1.2 3.6-2.5" />
      <path d="M14.5 9.5c.8.4 1.4 1.1 1.5 2 .2 1.3-.5 2.5-1.7 3-1 .4-2.2.2-3-.5-.6-.6-.9-1.4-.8-2.3.1-1 .7-1.8 1.5-2.2.6-.3 1.3-.3 2 0z" />
    </svg>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        color: 'rgba(255,255,255,0.4)',
        transition: 'color 200ms',
        display: 'flex',
        alignItems: 'center',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
    >
      {children}
    </a>
  );
}

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
  contactLocation = 'Mairangi Bay, Auckland, New Zealand',
  contactEmail = 'hello@mhj.nz',
  socialInstagram,
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
          maxWidth: '1320px',
          margin: '0 auto',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '80px',
        }}
      >
        {/* Brand */}
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
              { label: 'About',      href: '/about' },
              { label: 'Magazine',   href: '/magazine' },
              { label: 'Blog',       href: '/blog' },
              { label: 'StoryPress', href: '/storypress' },
              { label: 'Privacy',    href: '/privacy' },
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
              {contactLocation}
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="font-bold transition-colors duration-200"
              style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              {contactEmail}
            </a>

            {/* SNS Icons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              {socialInstagram && (
                <SocialLink href={socialInstagram} label="Instagram">
                  <InstagramIcon />
                </SocialLink>
              )}
              {socialFacebook && (
                <SocialLink href={socialFacebook} label="Facebook">
                  <FacebookIcon />
                </SocialLink>
              )}
              {socialYoutube && (
                <SocialLink href={socialYoutube} label="YouTube">
                  <YouTubeIcon />
                </SocialLink>
              )}
              {socialThreads && (
                <SocialLink href={socialThreads} label="Threads">
                  <ThreadsIcon />
                </SocialLink>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between"
        style={{
          maxWidth: '1320px',
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
          &copy; 2026 My Mairangi Journal
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
