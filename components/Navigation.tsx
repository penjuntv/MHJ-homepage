'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Sun, Moon, Instagram, Mail } from 'lucide-react';
import SearchOverlay from './SearchOverlay';
import { useTheme } from './ThemeProvider';

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Journal', href: '/blog' },
  { label: 'Magazine', href: '/magazine' },
  { label: 'StoryPress', href: '/storypress' },
];

interface NavItem {
  label: string;
  path: string;
  visible: boolean;
  order: number;
}

interface NavProps {
  siteName?: string;
  siteSubtitle?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialYoutube?: string;
  socialThreads?: string;
  contactEmail?: string;
  navigationItems?: NavItem[];
}

export default function Navigation({ socialInstagram, contactEmail, navigationItems }: NavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const brandColor = isDark ? 'var(--mhj-brown-dark)' : 'var(--mhj-brown)';
  const menuDefault = isDark ? '#B0ADA6' : '#444';
  const menuHover = brandColor;

  const effectiveLinks = (navigationItems && navigationItems.length > 0)
    ? navigationItems
        .filter(item => item.visible)
        .sort((a, b) => a.order - b.order)
        .map(item => ({ label: item.label, href: item.path }))
    : NAV_LINKS;

  const isActive = (href: string) => {
    if (href === '/blog') return pathname.startsWith('/blog');
    if (href === '/magazine') return pathname.startsWith('/magazine');
    if (href === '/storypress') return pathname.startsWith('/storypress');
    return pathname === href;
  };

  const toggleMobile = () => {
    setMobileOpen((prev) => {
      document.body.style.overflow = prev ? '' : 'hidden';
      return !prev;
    });
  };

  const closeMobile = () => {
    setMobileOpen(false);
    document.body.style.overflow = '';
  };

  const openSearch = () => {
    setMobileOpen(false);
    document.body.style.overflow = '';
    setSearchOpen(true);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 nav-backdrop"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: '0 clamp(24px, 4vw, 40px)', height: '72px' }}
        >
          {/* ── MHJ 브랜드 로고 ── */}
          <Link href="/" className="flex flex-col items-start" onClick={closeMobile} style={{ textDecoration: 'none' }}>
            <span
              className="font-display"
              style={{
                fontSize: 28,
                fontWeight: 400,
                letterSpacing: '0.05em',
                color: brandColor,
                lineHeight: 1,
              }}
            >
              MHJ
            </span>
            <span
              style={{
                width: 56,
                height: 1,
                background: brandColor,
                display: 'block',
                margin: '5px 0',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontSize: 10,
                fontWeight: 400,
                letterSpacing: '0.28em',
                color: brandColor,
                textTransform: 'lowercase' as const,
                lineHeight: 1,
              }}
            >
              my mairangi
            </span>
          </Link>

          {/* ── 데스크톱 메뉴 ── */}
          <div className="desktop-nav flex items-center" style={{ gap: '36px' }}>
            {effectiveLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '13px',
                  fontWeight: 400,
                  letterSpacing: '0.04em',
                  color: isActive(link.href) ? brandColor : menuDefault,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => { if (!isActive(link.href)) e.currentTarget.style.color = menuHover; }}
                onMouseLeave={e => { if (!isActive(link.href)) e.currentTarget.style.color = menuDefault; }}
              >
                {link.label}
              </Link>
            ))}

            {/* 아이콘 버튼들 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {socialInstagram && (
                <NavSocialBtn href={socialInstagram} label="Instagram" isDark={isDark}>
                  <Instagram size={17} />
                </NavSocialBtn>
              )}
              {contactEmail && (
                <NavSocialBtn href={`mailto:${contactEmail}`} label="Email" isDark={isDark}>
                  <Mail size={17} />
                </NavSocialBtn>
              )}
              <IconBtn onClick={openSearch} label="Search" isDark={isDark}>
                <Search size={17} />
              </IconBtn>
              <IconBtn onClick={toggleTheme} label={isDark ? 'Light mode' : 'Dark mode'} isDark={isDark}>
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </IconBtn>
            </div>
          </div>

          {/* ── 모바일: 검색 + 테마 + 햄버거 ── */}
          <div className="mobile-toggle" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <IconBtn onClick={openSearch} label="Search" isDark={isDark}><Search size={18} /></IconBtn>
            <IconBtn onClick={toggleTheme} label="Theme" isDark={isDark}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </IconBtn>

            <button
              onClick={toggleMobile}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px' }}
              aria-label="Open menu"
            >
              <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--text)', transition: 'all 0.3s', transform: mobileOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
              <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--text)', transition: 'all 0.3s', opacity: mobileOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--text)', transition: 'all 0.3s', transform: mobileOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* 모바일 풀스크린 메뉴 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center"
          style={{ gap: '24px', background: 'var(--bg)' }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobile}
              style={{
                fontSize: '28px',
                fontWeight: 400,
                letterSpacing: '0.04em',
                color: isActive(link.href) ? brandColor : menuDefault,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* 검색 오버레이 */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* 네비게이션 높이만큼 상단 여백 */}
      <div style={{ height: '72px' }} />
    </>
  );
}

function IconBtn({ onClick, label, isDark, children }: {
  onClick: () => void; label: string; isDark: boolean; children: React.ReactNode;
}) {
  const hoverColor = isDark ? 'var(--mhj-brown-dark)' : 'var(--mhj-brown)';
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isDark ? '#B0ADA6' : '#444', padding: '8px', borderRadius: '8px',
        transition: 'color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = hoverColor;
        e.currentTarget.style.background = isDark ? 'rgba(201,168,130,0.1)' : 'rgba(138,107,79,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = isDark ? '#B0ADA6' : '#444';
        e.currentTarget.style.background = 'none';
      }}
    >
      {children}
    </button>
  );
}

function NavSocialBtn({ href, label, isDark, children }: {
  href: string; label: string; isDark: boolean; children: React.ReactNode;
}) {
  const isExternal = !href.startsWith('mailto:');
  const hoverColor = isDark ? 'var(--mhj-brown-dark)' : 'var(--mhj-brown)';
  return (
    <a
      href={href}
      aria-label={label}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isDark ? '#B0ADA6' : '#444', padding: '8px', borderRadius: '8px',
        textDecoration: 'none',
        transition: 'color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = hoverColor;
        e.currentTarget.style.background = isDark ? 'rgba(201,168,130,0.1)' : 'rgba(138,107,79,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = isDark ? '#B0ADA6' : '#444';
        e.currentTarget.style.background = 'none';
      }}
    >
      {children}
    </a>
  );
}
