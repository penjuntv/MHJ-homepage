'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, FileText, BookOpen, Settings, Palette, LogOut, ExternalLink, Mail, Images, MessageCircle, Send, FileImage, SearchCheck, Star, Users } from 'lucide-react';

const NAV = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/admin/blogs', label: '블로그', icon: FileText, exact: false },
  { href: '/admin/hero', label: '히어로 캐러셀', icon: Star, exact: false },
  { href: '/admin/magazines', label: '매거진', icon: BookOpen, exact: false },
  { href: '/admin/family', label: '패밀리', icon: Users, exact: false },
  { href: '/admin/gallery', label: '갤러리', icon: Images, exact: false },
  { href: '/admin/media', label: '미디어', icon: FileImage, exact: false },
  { href: '/admin/seo', label: 'SEO', icon: SearchCheck, exact: false },
  { href: '/admin/comments', label: '댓글', icon: MessageCircle, exact: false },
  { href: '/admin/newsletter', label: '뉴스레터', icon: Send, exact: false },
  { href: '/admin/subscribers', label: '구독자', icon: Mail, exact: false },
  { href: '/admin/settings', label: '설정', icon: Settings, exact: false },
  { href: '/admin/design-kit', label: '디자인 키트', icon: Palette, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [pendingComments, setPendingComments] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !isLogin) {
        router.replace('/admin/login');
      } else {
        setReady(true);
        if (session) {
          supabase.from('comments').select('*', { count: 'exact', head: true }).eq('approved', false)
            .then(({ count }) => setPendingComments(count ?? 0));
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

      {/* ─── 사이드바 ─── */}
      <aside style={{
        width: 220,
        background: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
      }}>
        {/* 브랜드 */}
        <div style={{ padding: '28px 20px 20px' }}>
          <h1 style={{ fontSize: 15, fontWeight: 900, fontStyle: 'italic', letterSpacing: -0.5, color: 'white', margin: 0 }}>MY MAIRANGI</h1>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 4, textTransform: 'uppercase', display: 'block', marginTop: 4 }}>CMS Admin</span>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 20px' }} />

        {/* 네비 */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            const isComments = href === '/admin/comments';
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 10, marginBottom: 2,
                textDecoration: 'none',
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.4)',
                fontSize: 13, fontWeight: 700,
                transition: 'all 0.15s',
              }}>
                <Icon size={15} />
                <span style={{ flex: 1 }}>{label}</span>
                {isComments && pendingComments > 0 && (
                  <span style={{
                    background: '#EF4444', color: '#fff',
                    borderRadius: 999, padding: '2px 7px',
                    fontSize: 10, fontWeight: 900, lineHeight: '16px',
                  }}>
                    {pendingComments}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 하단 */}
        <div style={{ padding: '12px 10px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Link href="/" target="_blank" style={{
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
      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', background: '#F8FAFC' }}>
        {children}
      </main>

    </div>
  );
}
