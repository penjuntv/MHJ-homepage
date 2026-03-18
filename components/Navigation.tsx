'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Sun, Moon, Instagram, Youtube, Mail, Facebook } from 'lucide-react';
import SearchOverlay from './SearchOverlay';
import { useTheme } from './ThemeProvider';

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Magazine', href: '/magazine' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
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

export default function Navigation({ siteName, siteSubtitle, socialInstagram, socialFacebook, socialYoutube, socialThreads, contactEmail, navigationItems }: NavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const effectiveLinks = (navigationItems && navigationItems.length > 0)
    ? navigationItems
        .filter(item => item.visible)
        .sort((a, b) => a.order - b.order)
        .map(item => ({ label: item.label, href: item.path }))
    : NAV_LINKS;

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
            {effectiveLinks.map((link) => (
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
              {socialFacebook && (
                <NavSocialBtn href={socialFacebook} label="Facebook" isDark={isDark}>
                  <Facebook size={17} />
                </NavSocialBtn>
              )}
              {socialYoutube && (
                <NavSocialBtn href={socialYoutube} label="YouTube" isDark={isDark}>
                  <Youtube size={17} />
                </NavSocialBtn>
              )}
              {socialThreads && (
                <NavSocialBtn href={socialThreads} label="Threads" isDark={isDark}>
                  <ThreadsIcon size={17} />
                </NavSocialBtn>
              )}
              {contactEmail && (
                <NavSocialBtn href={`mailto:${contactEmail}`} label="Email" isDark={isDark}>
                  <Mail size={17} />
                </NavSocialBtn>
              )}
              {/* 검색 */}
              <IconBtn onClick={openSearch} label="Search" isDark={isDark}>
                <Search size={17} />
              </IconBtn>
              {/* 다크모드 토글 */}
              <IconBtn onClick={toggleTheme} label={isDark ? 'Light mode' : 'Dark mode'} isDark={isDark}>
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </IconBtn>
            </div>
          </div>

          {/* 모바일: 검색 + 테마 + 햄버거 */}
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

function ThreadsIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.839 3.08 3.454 5.325l-2.04.62c-.48-1.795-1.353-3.233-2.595-4.214-1.348-1.036-3.138-1.56-5.32-1.57h-.01C9.55 2.27 7.306 3.072 5.79 4.784c-1.435 1.617-2.158 3.967-2.18 6.985v.014c.021 3.018.744 5.368 2.18 6.984 1.517 1.713 3.76 2.513 6.718 2.524 1.803-.007 3.4-.39 4.746-1.14 1.426-.804 2.362-1.956 2.756-3.42.224-.846.35-1.725.35-2.612 0-.866-.12-1.707-.35-2.506-.354-1.26-1.03-2.259-2-2.97-.7-.512-1.534-.84-2.494-.98-.086 1.376-.367 2.598-.835 3.613-.553 1.197-1.404 2.116-2.537 2.733-.866.474-1.8.73-2.762.762-1.268.04-2.48-.34-3.36-1.06-.99-.81-1.509-2.02-1.464-3.37.04-1.204.477-2.197 1.285-2.87.74-.617 1.71-.95 2.796-.97.858-.016 1.684.154 2.415.5.255.12.496.255.72.404.005-.215.008-.43.008-.647v-.009C14.81 5.11 13.553 4.57 12.115 4.56c-.968 0-1.864.226-2.64.667-.685.39-1.24.944-1.65 1.65L5.99 5.705c.6-1.046 1.43-1.868 2.47-2.44C9.49 2.7 10.764 2.39 12.115 2.39c2.214 0 4.007.778 5.177 2.145.867 1.012 1.427 2.347 1.637 3.898a9.8 9.8 0 0 1 1.636.72c1.373.82 2.356 2.094 2.837 3.728.298 1.065.445 2.17.445 3.28 0 1.115-.148 2.264-.458 3.364-.558 2.08-1.847 3.714-3.727 4.718-1.664.934-3.682 1.41-5.898 1.42z"/>
    </svg>
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
