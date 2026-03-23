'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Comment } from '@/lib/types';

const AUTHOR_NAMES = ['Yussi', 'PeNnY'];

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

function isAuthor(name: string): boolean {
  return AUTHOR_NAMES.some(a => a.toLowerCase() === name.toLowerCase());
}

/* ── 댓글 폼 (최상위 + 답글 공용) ─────────────────────── */
function CommentForm({
  blogId,
  parentId,
  onSubmitted,
  onCancel,
  compact,
}: {
  blogId: number;
  parentId?: number | null;
  onSubmitted: () => void;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const [form, setForm] = useState({ name: '', email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: compact ? '10px 14px' : '14px 18px',
    borderRadius: 8,
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
      ? '1.5px solid var(--text)'
      : '1px solid var(--border-medium)',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.content) return;
    setSubmitting(true);

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blog_id: blogId,
        ...form,
        ...(parentId ? { parent_id: parentId } : {}),
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      setForm({ name: '', email: '', content: '' });
      setToast('Your comment is awaiting approval. Thank you!');
      setTimeout(() => { setToast(''); onSubmitted(); }, 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setToast(data.error || 'Something went wrong. Please try again.');
      setTimeout(() => setToast(''), 5000);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--bg-surface)',
      borderRadius: compact ? 8 : 16,
      padding: compact ? 16 : 'clamp(24px, 4vw, 40px)',
      marginBottom: compact ? 16 : 56,
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
            Name *
          </label>
          <input
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            placeholder="Your name"
            required
            maxLength={50}
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
            Email *
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

      <div style={{ marginBottom: compact ? 16 : 24 }}>
        <label style={{
          display: 'block',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 3,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          {parentId ? 'Reply *' : 'Comment *'}
        </label>
        <textarea
          value={form.content}
          onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
          onFocus={() => setFocused('content')}
          onBlur={() => setFocused(null)}
          placeholder={parentId ? 'Write a reply...' : 'Share your thoughts...'}
          required
          maxLength={2000}
          rows={compact ? 3 : 5}
          style={{ ...inputStyle('content'), resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: 'var(--text)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: compact ? 8 : 999,
            padding: compact ? '10px 24px' : '16px 40px',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {submitting ? 'Submitting...' : parentId ? 'Reply' : 'Leave a Comment'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-medium)',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 3,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {toast && (
        <p style={{
          marginTop: 16,
          padding: '14px 20px',
          background: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
        }}>
          {toast}
        </p>
      )}
    </form>
  );
}

/* ── 단일 댓글 아이템 ─────────────────────── */
function CommentItem({
  comment,
  mounted,
  replies,
  blogId,
  onReplySubmitted,
}: {
  comment: Comment;
  mounted: boolean;
  replies: Comment[];
  blogId: number;
  onReplySubmitted: () => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div>
      {/* 댓글 본체 */}
      <div style={{ padding: '32px 0' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 13,
                fontWeight: 900,
                color: 'var(--bg)',
                textTransform: 'uppercase',
              }}>
                {comment.name.charAt(0)}
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', margin: 0 }}>
              {comment.name}
            </p>
            {isAuthor(comment.name) && (
              <span style={{
                background: '#4F46E5',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                lineHeight: '16px',
              }}>
                Author
              </span>
            )}
          </div>
          <p style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            margin: 0,
            fontWeight: 600,
            letterSpacing: 1,
          }}>
            {mounted ? timeAgo(comment.created_at) : comment.created_at.slice(0, 10).replace(/-/g, '.')}
          </p>
        </div>
        <p style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          lineHeight: 1.75,
          margin: '0 0 0 48px',
          whiteSpace: 'pre-wrap',
        }}>
          {comment.content}
        </p>

        {/* Reply 버튼 (최상위 댓글에만 — parent_id가 없는 것) */}
        {!comment.parent_id && (
          <button
            type="button"
            onClick={() => setShowReplyForm(v => !v)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              cursor: 'pointer',
              marginLeft: 48,
              marginTop: 8,
              padding: 0,
            }}
          >
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        )}
      </div>

      {/* 답글 폼 */}
      {showReplyForm && (
        <div style={{ marginLeft: 32 }}>
          <CommentForm
            blogId={blogId}
            parentId={comment.id}
            compact
            onSubmitted={() => {
              setShowReplyForm(false);
              onReplySubmitted();
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* 답글 목록 */}
      {replies.length > 0 && (
        <div style={{ marginLeft: 32 }}>
          {replies.map((reply) => (
            <div
              key={reply.id}
              style={{
                padding: '24px 0',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 10,
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: 'var(--bg)',
                      textTransform: 'uppercase',
                    }}>
                      {reply.name.charAt(0)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', margin: 0 }}>
                    {reply.name}
                  </p>
                  {isAuthor(reply.name) && (
                    <span style={{
                      background: '#4F46E5',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      lineHeight: '16px',
                    }}>
                      Author
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  margin: 0,
                  fontWeight: 600,
                  letterSpacing: 1,
                }}>
                  {mounted ? timeAgo(reply.created_at) : reply.created_at.slice(0, 10).replace(/-/g, '.')}
                </p>
              </div>
              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                margin: '0 0 0 38px',
                whiteSpace: 'pre-wrap',
              }}>
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 메인 CommentSection ─────────────────────── */
export default function CommentSection({ blogId }: { blogId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/comments?blog_id=${blogId}`);
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [blogId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);
  useEffect(() => { setMounted(true); }, []);

  // 최상위 댓글과 답글 분리
  const { topLevel, repliesMap } = useMemo(() => {
    const top: Comment[] = [];
    const replies: Record<number, Comment[]> = {};
    for (const c of comments) {
      if (c.parent_id) {
        if (!replies[c.parent_id]) replies[c.parent_id] = [];
        replies[c.parent_id].push(c);
      } else {
        top.push(c);
      }
    }
    return { topLevel: top, repliesMap: replies };
  }, [comments]);

  const totalCount = comments.length;

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
            Comments ({totalCount})
          </h2>
        </div>

        {/* 댓글 작성 폼 */}
        <CommentForm blogId={blogId} onSubmitted={fetchComments} />

        {/* 댓글 목록 */}
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>
            Loading comments...
          </p>
        ) : totalCount === 0 ? (
          <p style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '40px 0',
            fontStyle: 'italic',
          }}>
            Be the first to share your thoughts!
          </p>
        ) : (
          <div>
            {topLevel.map((c, i) => (
              <div
                key={c.id}
                className={`slide-up stagger-${Math.min(i + 1, 4)}`}
                style={{
                  borderBottom: i < topLevel.length - 1
                    ? '1px solid var(--border)'
                    : 'none',
                }}
              >
                <CommentItem
                  comment={c}
                  mounted={mounted}
                  replies={repliesMap[c.id] || []}
                  blogId={blogId}
                  onReplySubmitted={fetchComments}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
