'use client';

import Link from 'next/link';
import { Rss, Instagram, Facebook, Youtube, Mail } from 'lucide-react';

interface FooterProps {
  siteName?: string;
  siteSubtitle?: string;
  footerDescription?: string;
  contactLocation?: string;
  contactEmail?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialYoutube?: string;
}

export default function Footer({
  siteName = 'MY MAIRANGI',
  siteSubtitle = 'Family Archive',
  footerDescription = '뉴질랜드 오클랜드 노스쇼어\n마이랑이 베이에서 기록하는\n우리 가족의 이야기',
  contactLocation = 'Mairangi Bay, Auckland',
  contactEmail,
  socialInstagram,
  socialFacebook,
  socialYoutube,
}: FooterProps) {
  const descLines = footerDescription.split('\n');

  const socials = [
    { href: socialInstagram,                                  icon: <Instagram size={16} />, label: 'Instagram' },
    { href: socialFacebook,                                   icon: <Facebook  size={16} />, label: 'Facebook'  },
    { href: socialYoutube,                                    icon: <Youtube   size={16} />, label: 'YouTube'   },
    { href: contactEmail ? `mailto:${contactEmail}` : '',     icon: <Mail      size={16} />, label: 'Email'     },
  ].filter(s => !!s.href);

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

          {/* 소셜 아이콘 */}
          {socials.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '28px', flexWrap: 'wrap' }}>
              {socials.map(s => (
                <SocialBtn key={s.label} href={s.href!} label={s.label}>
                  {s.icon}
                </SocialBtn>
              ))}
            </div>
          )}
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
              {contactLocation}
            </p>
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="font-bold"
                style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
              >
                {contactEmail}
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

/* ── 소셜 아이콘 버튼 ── */
function SocialBtn({
  href, label, children,
}: {
  href: string; label: string; children: React.ReactNode;
}) {
  const isExternal = !href.startsWith('mailto:');
  return (
    <a
      href={href}
      aria-label={label}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.55)',
        textDecoration: 'none',
        transition: 'background 0.2s, color 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
      }}
    >
      {children}
    </a>
  );
}
