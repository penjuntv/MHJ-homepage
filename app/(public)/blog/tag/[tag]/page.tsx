import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Blog } from '@/lib/types';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  return {
    title: `Posts tagged #${tag}`,
    description: `Posts tagged #${tag} on MHJ`,
    alternates: { canonical: `${SITE_URL}/blog/tag/${tag}` },
    robots: { index: false, follow: true },
  };
}

async function getBlogsByTag(tag: string): Promise<Blog[]> {
  const { data } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .contains('tags', [tag])
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag);
  const blogs = await getBlogsByTag(tag);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: `Tag: ${tag}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px clamp(24px, 4vw, 80px)' }}>

          {/* Back */}
          <Link href="/blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            padding: '16px 20px', background: 'var(--bg-surface)',
            borderRadius: 999, fontWeight: 900, fontSize: 10,
            letterSpacing: 3, textTransform: 'uppercase',
            textDecoration: 'none', color: 'var(--text)', marginBottom: 64,
            transition: 'background 0.2s',
          }}>
            <ArrowLeft size={18} /> Back to Library
          </Link>

          {/* 헤더 */}
          <div style={{ marginBottom: 64 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 16 }}>
              Tag
            </p>
            <h1 className="font-display font-black" style={{
              fontSize: 'clamp(40px, 7vw, 96px)',
              letterSpacing: '-3px',
              lineHeight: 0.9,
              fontStyle: 'italic',
              color: 'var(--text)',
            }}>
              #{tag}
            </h1>
            <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {blogs.length} {blogs.length === 1 ? 'post' : 'posts'}
            </p>
          </div>

          {/* 글 목록 */}
          {blogs.length === 0 ? (
            <p style={{ fontSize: 16, color: 'var(--text-tertiary)', textAlign: 'center', padding: '80px 0' }}>
              No posts with this tag.
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
              gap: 24,
            }}>
              {blogs.map(blog => (
                <Link key={blog.id} href={`/blog/${blog.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                  }} className="blog-tag-card">
                    <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                      <SafeImage
                        src={blog.image_url}
                        alt={blog.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                        style={{ transition: 'transform 0.5s' }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                      }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px' }}>
                        <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>
                          {blog.category} · {blog.date}
                        </p>
                        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
                          {blog.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
