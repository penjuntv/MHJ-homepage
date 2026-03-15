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
  const [focused, setFocused] = useState<string | null>(null);

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

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 12,
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: 'var(--bg)',
    transition: 'border-color 0.2s',
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    ...inputBase,
    border: focused === field
      ? '1.5px solid #4F46E5'
      : '1px solid var(--border-medium)',
  });

  return (
    <section style={{
      padding: 'clamp(60px, 8vw, 100px) clamp(24px, 4vw, 80px)',
      background: 'var(--bg)',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* 섹션 제목 */}
        <div style={{ marginBottom: 48 }}>
          <p style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 5,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
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

        {/* 6) 입력 폼 */}
        <form onSubmit={handleSubmit} style={{
          background: 'var(--bg-surface)',
          borderRadius: 24,
          padding: 'clamp(24px, 4vw, 40px)',
          marginBottom: 56,
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 3,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                이름 *
              </label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                placeholder="Your name"
                required
                style={inputStyle('name')}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 3,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                이메일 *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="your@email.com"
                required
                style={inputStyle('email')}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 3,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              댓글 *
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              onFocus={() => setFocused('content')}
              onBlur={() => setFocused(null)}
              placeholder="Share your thoughts..."
              required
              rows={5}
              style={{ ...inputStyle('content'), resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'var(--text)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 999,
              padding: '16px 40px',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 3,
              textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : 'Leave a Comment'}
          </button>

          {toast && (
            <p className="comment-toast" style={{
              marginTop: 16,
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
              color: '#4F46E5',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
            }}>
              {toast}
            </p>
          )}
        </form>

        {/* 6) 댓글 목록: border-bottom 구분 */}
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '40px 0',
            fontStyle: 'italic',
          }}>
            Be the first to share your thoughts.
          </p>
        ) : (
          <div>
            {comments.map((c, i) => (
              <div
                key={c.id}
                className={`slide-up stagger-${Math.min(i + 1, 4)}`}
                style={{
                  padding: '32px 0',
                  borderBottom: i < comments.length - 1
                    ? '1px solid var(--border)'
                    : 'none',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 14,
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* 아바타 이니셜 */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: 'white',
                        textTransform: 'uppercase',
                      }}>
                        {c.name.charAt(0)}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', margin: 0 }}>
                      {c.name}
                    </p>
                  </div>
                  <p style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    margin: 0,
                    fontWeight: 600,
                    letterSpacing: 1,
                  }}>
                    {timeAgo(c.created_at)}
                  </p>
                </div>
                <p style={{
                  fontSize: 15,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  margin: '0 0 0 48px',
                  whiteSpace: 'pre-wrap',
                }}>
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
