'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Sun, Moon, Instagram, Youtube, Mail } from 'lucide-react';
import SearchOverlay from './SearchOverlay';
import { useTheme } from './ThemeProvider';

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Magazine', href: '/magazine' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'StoryPress', href: '/storypress' },
];

interface NavProps {
  siteName?: string;
  siteSubtitle?: string;
  socialInstagram?: string;
  socialYoutube?: string;
  contactEmail?: string;
}

export default function Navigation({ siteName, siteSubtitle, socialInstagram, socialYoutube, contactEmail }: NavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const isActive = (href: string) => {
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
          {/* 브랜드 */}
          <Link href="/" className="flex flex-col" onClick={closeMobile}>
            <span
              className="font-black tracking-wider-5 uppercase"
              style={{ fontSize: '20px', letterSpacing: '3px', color: 'var(--text)' }}
            >
              {siteName || 'MY MAIRANGI'}
            </span>
            <span
              className="font-black uppercase"
              style={{ fontSize: '8px', letterSpacing: '4px', color: 'var(--text-tertiary)' }}
            >
              {siteSubtitle || 'Family Archive'}
            </span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="desktop-nav flex items-center" style={{ gap: '36px' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-black uppercase transition-colors duration-300"
                style={{
                  fontSize: '11px',
                  letterSpacing: '3px',
                  color: isActive(link.href) ? '#4F46E5' : 'var(--text)',
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* 아이콘 버튼들 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* 소셜 아이콘 (설정된 경우만 표시) */}
              {socialInstagram && (
                <NavSocialBtn href={socialInstagram} label="Instagram" isDark={isDark}>
                  <Instagram size={17} />
                </NavSocialBtn>
              )}
              {socialYoutube && (
                <NavSocialBtn href={socialYoutube} label="YouTube" isDark={isDark}>
                  <Youtube size={17} />
                </NavSocialBtn>
              )}
              {contactEmail && (
                <NavSocialBtn href={`mailto:${contactEmail}`} label="Email" isDark={isDark}>
                  <Mail size={17} />
                </NavSocialBtn>
              )}
              {/* 검색 */}
              <IconBtn onClick={openSearch} label="검색" isDark={isDark}>
                <Search size={17} />
              </IconBtn>
              {/* 다크모드 토글 */}
              <IconBtn onClick={toggleTheme} label={isDark ? '라이트 모드' : '다크 모드'} isDark={isDark}>
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </IconBtn>
            </div>
          </div>

          {/* 모바일: 검색 + 테마 + 햄버거 */}
          <div className="mobile-toggle" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <IconBtn onClick={openSearch} label="검색" isDark={isDark}><Search size={18} /></IconBtn>
            <IconBtn onClick={toggleTheme} label="테마" isDark={isDark}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </IconBtn>

            <button
              onClick={toggleMobile}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px' }}
              aria-label="메뉴 열기"
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
              className="font-black uppercase"
              style={{
                fontSize: '32px',
                letterSpacing: '3px',
                color: isActive(link.href) ? '#4F46E5' : 'var(--text)',
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
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text)', padding: '8px', borderRadius: '8px',
        transition: 'color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = '#4F46E5';
        e.currentTarget.style.background = isDark ? 'rgba(79,70,229,0.15)' : '#EEF2FF';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text)';
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
  return (
    <a
      href={href}
      aria-label={label}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text)', padding: '8px', borderRadius: '8px',
        textDecoration: 'none',
        transition: 'color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = '#4F46E5';
        e.currentTarget.style.background = isDark ? 'rgba(79,70,229,0.15)' : '#EEF2FF';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text)';
        e.currentTarget.style.background = 'none';
      }}
    >
      {children}
    </a>
  );
}
