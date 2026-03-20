'use client';

import Link from 'next/link';
import { LayoutList, ExternalLink, ChevronRight } from 'lucide-react';

const PAGES = [
  {
    id: 'landing',
    label: 'Landing',
    path: '/',
    desc: '히어로 캐러셀 · StoryPress · Explore · 뉴스레터',
    status: 'live' as const,
    sections: ['StoryPress 제목', 'StoryPress 설명', 'CTA 버튼'],
  },
  {
    id: 'about',
    label: 'About',
    path: '/about',
    desc: 'WHO WE ARE · VISION & VALUES · 딸 프로필',
    status: 'live' as const,
    sections: ['WHO WE ARE 제목·소개', '비전 타이틀·설명', '가족 사진 2장'],
  },
  {
    id: 'storypress',
    label: 'StoryPress',
    path: '/storypress',
    desc: '히어로 · 소개 · 기능',
    status: 'live' as const,
    sections: ['제목', '설명', 'CTA 버튼', '히어로 이미지'],
  },
  {
    id: 'magazine',
    label: 'Magazine Shelf',
    path: '/magazine',
    desc: '서가 UI',
    status: 'live' as const,
    sections: ['페이지 제목', '스크롤 힌트'],
  },
  {
    id: 'blog',
    label: 'Blog Library',
    path: '/blog',
    desc: '카테고리 필터 · 블로그 그리드',
    status: 'live' as const,
    sections: ['라이브러리 제목', '라이브러리 설명'],
  },
  {
    id: 'gallery',
    label: 'Gallery',
    path: '/gallery',
    desc: '카테고리 필터 · 마소니 그리드',
    status: 'live' as const,
    sections: ['갤러리 제목', '갤러리 설명'],
  },
];

export default function PagesAdminPage() {
  return (
    <div style={{ padding: '48px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <LayoutList size={22} color="#4F46E5" />
          <h1 className="font-display font-black" style={{ fontSize: 36, letterSpacing: -1.5, margin: 0 }}>페이지 관리</h1>
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>각 공개 페이지의 섹션 텍스트와 이미지를 편집합니다.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PAGES.map((page) => (
          <Link key={page.id} href={`/mhj-desk/pages/${page.id}`} style={{
            display: 'flex', alignItems: 'center', gap: 20,
            background: 'white', borderRadius: 20, padding: '20px 24px',
            border: '1px solid #f1f5f9', textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            transition: 'all 0.2s',
          }}>
            {/* 상태 인디케이터 */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: page.status === 'live' ? '#10B981' : '#F59E0B',
            }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>{page.label}</p>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{page.path}</span>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, margin: 0 }}>{page.desc}</p>
              {/* 편집 가능 섹션 태그 */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {page.sections.map(s => (
                  <span key={s} style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                    padding: '3px 8px', borderRadius: 6,
                    background: '#f8fafc', color: '#64748b', border: '1px solid #f1f5f9',
                  }}>{s}</span>
                ))}
              </div>
            </div>

            {/* 상태 배지 */}
            <span style={{
              fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
              padding: '5px 12px', borderRadius: 8, flexShrink: 0,
              background: page.status === 'live' ? '#D1FAE5' : '#FEF3C7',
              color: page.status === 'live' ? '#065F46' : '#92400E',
            }}>
              {page.status === 'live' ? 'LIVE' : 'DRAFT'}
            </span>

            <a
              href={page.path}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color: '#cbd5e1', padding: 4, flexShrink: 0 }}
            >
              <ExternalLink size={14} />
            </a>

            <ChevronRight size={16} color="#cbd5e1" style={{ flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
