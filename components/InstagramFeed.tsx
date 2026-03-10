'use client';

import { useEffect, useState } from 'react';
import { Instagram } from 'lucide-react';

interface Post {
  id: string;
  media_url: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
  media_type: string;
}

interface Props {
  instagramUrl: string; // social_instagram from site_settings
}

export default function InstagramFeed({ instagramUrl }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [source, setSource] = useState<'instagram' | 'gallery' | 'none'>('none');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/instagram')
      .then(r => r.json())
      .then(data => {
        setPosts(data.posts ?? []);
        setSource(data.source);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // 포스트가 없으면 간단한 링크 배너만 표시
  if (loaded && posts.length === 0) {
    if (!instagramUrl) return null;
    return (
      <section style={{ background: '#FFF0F5', padding: 'clamp(40px, 6vw, 80px) clamp(24px, 4vw, 80px)', textAlign: 'center' }}>
        <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: '#F9A8D4', marginBottom: '16px' }}>
          INSTAGRAM
        </p>
        <h2 className="font-display font-black" style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1px', lineHeight: 1, marginBottom: '32px', fontStyle: 'italic', color: '#1A1A1A' }}>
          @MHJ Family on Instagram
        </h2>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#000', color: '#fff', padding: '16px 36px', borderRadius: '999px', textDecoration: 'none', fontSize: '12px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase' }}
        >
          <Instagram size={16} /> Follow on Instagram
        </a>
      </section>
    );
  }

  if (!loaded || posts.length === 0) return null;

  return (
    <section style={{ background: '#FFF0F5', padding: 'clamp(48px, 8vw, 96px) clamp(24px, 4vw, 80px)' }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color: '#F9A8D4', marginBottom: '16px' }}>
          {source === 'instagram' ? 'INSTAGRAM' : 'FROM OUR GALLERY'}
        </p>
        <h2 className="font-display font-black" style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1px', lineHeight: 1, fontStyle: 'italic', color: '#1A1A1A' }}>
          @MHJ Family on Instagram
        </h2>
      </div>

      {/* 피드 — 데스크탑 6개 1줄, 모바일 3개 */}
      <div className="instagram-grid" style={{ display: 'grid', gap: '8px', marginBottom: '40px' }}>
        {posts.map(post => (
          <FeedItem key={post.id} post={post} />
        ))}
      </div>

      {/* 팔로우 버튼 */}
      {instagramUrl && (
        <div style={{ textAlign: 'center' }}>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#000', color: '#fff', padding: '16px 40px', borderRadius: '999px', textDecoration: 'none', fontSize: '12px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase' }}
          >
            <Instagram size={16} /> Follow @MHJ_NZ
          </a>
        </div>
      )}
    </section>
  );
}

function FeedItem({ post }: { post: Post }) {
  const [hovered, setHovered] = useState(false);
  const hasStats = (post.like_count ?? 0) > 0 || (post.comments_count ?? 0) > 0;
  const href = post.permalink || undefined;

  const inner = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        aspectRatio: '1/1',
        overflow: 'hidden',
        borderRadius: '16px',
        cursor: href ? 'pointer' : 'default',
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.media_url}
        alt="Instagram post"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* 오버레이 (hover 시만) */}
      {hovered && hasStats && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '20px',
        }}>
          {(post.like_count ?? 0) > 0 && (
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ♥ {post.like_count?.toLocaleString()}
            </span>
          )}
          {(post.comments_count ?? 0) > 0 && (
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✦ {post.comments_count?.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
        {inner}
      </a>
    );
  }
  return inner;
}
