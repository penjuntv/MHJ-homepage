'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, FileText, BookOpen, Settings, Palette,
  LogOut, ExternalLink, Images, MessageCircle, Users,
  SearchCheck, LayoutList, Menu, Layers,
} from 'lucide-react';

type NavItem = { type: 'item'; href: string; label: string; icon: React.ElementType; exact?: boolean; badge?: 'comments' | 'blogs' };
type NavGroup = { type: 'group'; label: string };
type NavEntry = NavItem | NavGroup;

const NAV: NavEntry[] = [
  { type: 'item', href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },

  { type: 'group', label: '콘텐츠' },
  { type: 'item', href: '/admin/blogs', label: '블로그', icon: FileText, badge: 'blogs' },
  { type: 'item', href: '/admin/magazines', label: '매거진', icon: BookOpen },
  { type: 'item', href: '/admin/gallery', label: '갤러리', icon: Images },
  { type: 'item', href: '/admin/hero', label: '히어로 슬라이드', icon: Layers },
  { type: 'item', href: '/admin/seo', label: 'SEO', icon: SearchCheck },

  { type: 'group', label: '페이지' },
  { type: 'item', href: '/admin/pages', label: '페이지 관리', icon: LayoutList },
  { type: 'item', href: '/admin/navigation', label: '내비게이션', icon: Menu },

  { type: 'group', label: '커뮤니티' },
  { type: 'item', href: '/admin/comments', label: '댓글', icon: MessageCircle, badge: 'comments' },
  { type: 'item', href: '/admin/subscribers', label: '구독자', icon: Users },

  { type: 'group', label: '설정' },
  { type: 'item', href: '/admin/family', label: '패밀리', icon: Users },
  { type: 'item', href: '/admin/settings', label: '사이트 설정', icon: Settings },
  { type: 'item', href: '/admin/design-kit', label: '디자인 키트', icon: Palette },
];

const GROUP_LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 3,
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.22)',
  padding: '18px 14px 6px',
  display: 'block',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [pendingComments, setPendingComments] = useState(0);
  const [blogCount, setBlogCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !isLogin) {
        router.replace('/admin/login');
      } else {
        setReady(true);
        if (session) {
          Promise.all([
            supabase.from('comments').select('*', { count: 'exact', head: true }).eq('approved', false),
            supabase.from('blogs').select('*', { count: 'exact', head: true }),
          ]).then(([{ count: pc }, { count: bc }]) => {
            setPendingComments(pc ?? 0);
            setBlogCount(bc ?? 0);
          });
        }
      }
    });
  }, [isLogin, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  if (isLogin) return <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>{children}</div>;

  if (!ready) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, color: '#CBD5E1', textTransform: 'uppercase' }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>

      {/* ─── 모바일 햄버거 버튼 ─── */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed', top: 16, left: 16, zIndex: 100,
            width: 40, height: 40, borderRadius: 10,
            background: '#0A0A0A', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{ display: 'block', width: 16, height: 1.5, background: 'white', borderRadius: 2 }} />
            ))}
          </span>
        </button>
      )}

      {/* ─── 모바일 배경 오버레이 ─── */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* ─── 사이드바 ─── */}
      <aside style={{
        width: 220,
        background: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: isMobile ? (mobileOpen ? 0 : -220) : 0, bottom: 0,
        zIndex: 50,
        overflowY: 'auto',
        transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* 브랜드 */}
        <div style={{ padding: '28px 20px 20px', flexShrink: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 900, fontStyle: 'italic', letterSpacing: -0.5, color: 'white', margin: 0 }}>MY MAIRANGI</h1>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 4, textTransform: 'uppercase', display: 'block', marginTop: 4 }}>CMS Admin</span>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 20px', flexShrink: 0 }} />

        {/* 네비 */}
        <nav style={{ flex: 1, padding: '8px 10px' }}>
          {NAV.map((entry, idx) => {
            if (entry.type === 'group') {
              return (
                <span key={`group-${idx}`} style={GROUP_LABEL_STYLE}>
                  {entry.label}
                </span>
              );
            }

            const { href, label, icon: Icon, exact, badge } = entry;
            const active = exact ? pathname === href : pathname.startsWith(href);
            const badgeCount = badge === 'comments' ? pendingComments : badge === 'blogs' ? blogCount : 0;

            return (
              <Link key={href} href={href} onClick={() => isMobile && setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, marginBottom: 1,
                textDecoration: 'none',
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.4)',
                fontSize: 13, fontWeight: 700,
                transition: 'all 0.15s',
              }}>
                <Icon size={15} />
                <span style={{ flex: 1 }}>{label}</span>
                {badgeCount > 0 && (
                  <span style={{
                    background: badge === 'comments' ? '#EF4444' : 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    borderRadius: 999, padding: '2px 7px',
                    fontSize: 10, fontWeight: 900, lineHeight: '16px',
                  }}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 하단 */}
        <div style={{ padding: '12px 10px 24px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 4px 8px' }} />
          <Link href="https://mhj-homepage.vercel.app" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700,
          }}>
            <ExternalLink size={14} /> 사이트 보기
          </Link>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10, background: 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700,
          }}>
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
      </aside>

      {/* ─── 메인 ─── */}
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : 220, minHeight: '100vh', background: '#F8FAFC', paddingTop: isMobile ? 64 : 0 }}>
        {children}
      </main>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
