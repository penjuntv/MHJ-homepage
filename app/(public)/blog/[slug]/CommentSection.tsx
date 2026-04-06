'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Comment } from '@/lib/types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatCommentDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const CONTENT_MAX = 500;
const NAME_MAX = 30;
const COOLDOWN_MS = 30_000;
const COOLDOWN_KEY = 'mhj_comment_last';

/* ── Yussi 어드민 뱃지 스타일 ─── */
const adminBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#ffffff',
  background: '#8A6B4F',
  borderRadius: 4,
  padding: '1px 6px',
  lineHeight: '16px',
  letterSpacing: 0.5,
};

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
  const [honeypot, setHoneypot] = useState('');
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

    // 30초 클라이언트 쿨다운
    const last = sessionStorage.getItem(COOLDOWN_KEY);
    if (last && Date.now() - Number(last) < COOLDOWN_MS) {
      setToast('Please wait a moment before trying again.');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setSubmitting(true);

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blog_id: blogId,
        ...form,
        honeypot,
        ...(parentId ? { parent_id: parentId } : {}),
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      setForm({ name: '', email: '', content: '' });
      setToast('Your comment has been submitted and will appear after review.');
      setTimeout(() => { setToast(''); onSubmitted(); }, 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setToast(data.error || 'Something went wrong. Please try again.');
      setTimeout(() => setToast(''), 5000);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={compact ? {
      background: 'var(--bg-surface)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      border: '1px solid var(--border)',
    } : undefined}>
      {/* 허니팟 — 봇만 채우는 hidden 필드 */}
      <div style={{ position: 'absolute', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={e => setHoneypot(e.target.value)}
        />
      </div>

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
            placeholder="Name"
            required
            maxLength={NAME_MAX}
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
            placeholder="Email (not displayed)"
            required
            maxLength={100}
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
          placeholder={parentId ? 'Write a reply' : 'Leave a comment'}
          required
          maxLength={CONTENT_MAX}
          rows={3}
          style={{ ...inputStyle('content'), resize: 'vertical' }}
        />
        <p style={{
          textAlign: 'right',
          fontSize: 11,
          color: 'var(--text-tertiary)',
          margin: '6px 0 0',
          fontWeight: 600,
        }}>
          {form.content.length}/{CONTENT_MAX}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="submit"
          disabled={submitting}
          className="comment-submit-btn"
          style={{
            background: compact ? 'var(--text)' : 'transparent',
            color: compact ? 'var(--bg)' : 'var(--text)',
            border: compact ? 'none' : '1.5px solid var(--text)',
            borderRadius: compact ? 8 : 999,
            padding: compact ? '10px 24px' : '16px 40px',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {submitting ? 'Submitting...' : compact ? 'Reply' : 'Post comment'}
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
            {comment.is_admin && (
              <span style={adminBadgeStyle}>Yussi</span>
            )}
          </div>
          <p style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            margin: 0,
            fontWeight: 600,
            letterSpacing: 1,
          }}>
            {formatCommentDate(comment.created_at)}
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

        {/* Reply 버튼 (최상위 댓글에만) */}
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
        <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 24 }}>
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
        <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 24 }}>
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
                  {reply.is_admin && (
                    <span style={adminBadgeStyle}>Yussi</span>
                  )}
                </div>
                <p style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  margin: 0,
                  fontWeight: 600,
                  letterSpacing: 1,
                }}>
                  {mounted ? formatCommentDate(reply.created_at) : reply.created_at.slice(0, 10).replace(/-/g, '.')}
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
      padding: 'clamp(48px, 6vw, 80px) clamp(24px, 4vw, 40px)',
      background: 'var(--bg)',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* 섹션 제목 */}
        <div style={{ marginBottom: 32 }}>
          <p className="font-black uppercase" style={{
            fontSize: 10,
            letterSpacing: 5,
            color: 'var(--text-tertiary)',
            marginBottom: 12,
          }}>
            Join the conversation
          </p>
          <h2 className="font-display font-black" style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            letterSpacing: '-1px',
            lineHeight: 1,
            fontStyle: 'italic',
            color: 'var(--text)',
          }}>
            Comments{totalCount > 0 ? ` (${totalCount})` : ''}
          </h2>
        </div>

        {/* 댓글 목록 */}
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>
            Loading comments...
          </p>
        ) : totalCount === 0 ? (
          <p style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '32px 0',
            fontStyle: 'italic',
          }}>
            No comments yet. Be the first to leave one.
          </p>
        ) : (
          <div style={{ marginBottom: 32 }}>
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

        {/* 댓글 작성 폼 */}
        <CommentForm blogId={blogId} onSubmitted={fetchComments} />
      </div>
    </section>
  );
}
