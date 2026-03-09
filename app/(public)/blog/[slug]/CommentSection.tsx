'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Comment } from '@/lib/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} minute${m > 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo > 1 ? 's' : ''} ago`;
}

export default function CommentSection({ blogId }: { blogId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/comments?blog_id=${blogId}`);
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [blogId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.content) return;
    setSubmitting(true);

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blog_id: blogId, ...form }),
    });

    setSubmitting(false);
    if (res.ok) {
      setForm({ name: '', email: '', content: '' });
      setToast('Your comment has been submitted. It will appear after approval.');
      setTimeout(() => setToast(''), 5000);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <section style={{
      padding: 'clamp(60px, 8vw, 100px) clamp(24px, 4vw, 80px)',
      background: 'var(--bg)',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* 섹션 제목 */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>
            Conversation
          </p>
          <h2 className="font-display font-black" style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            letterSpacing: '-1px',
            lineHeight: 1,
            fontStyle: 'italic',
            color: 'var(--text)',
          }}>
            Comments ({comments.length})
          </h2>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} style={{
          background: 'var(--bg-surface)',
          borderRadius: 32,
          padding: 'clamp(24px, 4vw, 40px)',
          marginBottom: 48,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: 3, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>
                이름 *
              </label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: 3, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>
                이메일 *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="your@email.com"
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: 3, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>
              댓글 *
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Share your thoughts..."
              required
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="font-black uppercase"
            style={{
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '16px 40px',
              fontSize: 12,
              letterSpacing: 3,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : 'Leave a Comment'}
          </button>

          {toast && (
            <p style={{
              marginTop: 16,
              padding: '14px 20px',
              background: 'var(--accent-light, #EEF2FF)',
              color: '#4F46E5',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
            }}>
              {toast}
            </p>
          )}
        </form>

        {/* 댓글 목록 */}
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0', fontStyle: 'italic' }}>
            Be the first to share your thoughts.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comments.map(c => (
              <div key={c.id} style={{
                background: 'var(--bg-surface)',
                borderRadius: 24,
                padding: '28px 32px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0, fontWeight: 600, letterSpacing: 1 }}>
                    {timeAgo(c.created_at)}
                  </p>
                </div>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {c.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
