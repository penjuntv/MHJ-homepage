'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import { renderMailrangiNotes } from '@/lib/newsletter-template';
import type { MailrangiNotesData } from '@/lib/newsletter-template';
import { Loader2, Eye, X, Upload, ArrowLeft, Send, FlaskConical } from 'lucide-react';
import ImageCropModal from '@/components/admin/ImageCropModal';

/* ─────────────────────────────────────────────────────────── types */

interface BlogMini {
  id: number;
  title: string;
  slug: string;
  category: string;
  date: string;
  image_url: string;
  meta_description?: string;
}

interface LocalItem {
  emoji: string;
  label: string;
  title: string;
  body: string;
  link: string;
}

/* ─────────────────────────────────────────────────────── sub-components */

function SectionCard({
  num,
  title,
  badge,
  optional = false,
  enabled = true,
  onToggle,
  children,
}: {
  num: number;
  title: string;
  badge?: string;
  optional?: boolean;
  enabled?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      border: `1.5px solid ${enabled ? '#E2E8F0' : '#F1F5F9'}`,
      overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '18px 24px',
        background: enabled ? '#ffffff' : '#F8FAFC',
        borderBottom: enabled ? '1px solid #F1F5F9' : 'none',
      }}>
        <div style={{
          background: enabled ? '#1a1a1a' : '#CBD5E1',
          width: 28, height: 28, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'white', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>{num}</span>
        </div>
        <span style={{
          fontWeight: 900, fontSize: 11, letterSpacing: 3,
          textTransform: 'uppercase', flex: 1,
          color: enabled ? '#1a1a1a' : '#94A3B8',
        }}>
          {title}
        </span>
        {badge && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
            color: '#818cf8', border: '1px solid #818cf8', padding: '2px 8px',
          }}>
            {badge}
          </span>
        )}
        {optional && (
          <button
            type="button"
            onClick={onToggle}
            style={{
              padding: '6px 16px', borderRadius: 999, border: 'none',
              background: enabled ? '#1a1a1a' : '#F1F5F9',
              color: enabled ? '#ffffff' : '#94A3B8',
              fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        )}
      </div>
      {enabled && (
        <div style={{ padding: '20px 24px 24px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── shared styles */

const IS: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  border: '1px solid #E2E8F0', background: '#F8FAFC',
  fontSize: 14, color: '#1a1a1a', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

const LS: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 900,
  letterSpacing: 3, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6,
};

function Label({ children }: { children: React.ReactNode }) {
  return <label style={LS}>{children}</label>;
}

function Input({
  value, onChange, placeholder, type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={IS}
    />
  );
}

function Textarea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...IS, resize: 'vertical', lineHeight: 1.7 }}
    />
  );
}

function Row({ gap = 16, children }: { gap?: number; children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap, flexWrap: 'wrap' as const }}>{children}</div>;
}

function Field({
  label, flex = 1, children,
}: {
  label: string;
  flex?: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ flex, minWidth: 0 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function BlogSelect({
  blogs, value, onChange,
}: {
  blogs: BlogMini[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(Number(e.target.value))}
      style={{ ...IS, cursor: 'pointer' }}
    >
      <option value="">— 저널 글 선택 —</option>
      {blogs.map(b => (
        <option key={b.id} value={b.id}>
          {b.title} ({b.date}) · {b.category}
        </option>
      ))}
    </select>
  );
}

/* ─────────────────────────────────────────────────────── main page */

export default function NewsletterComposePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initId = searchParams.get('id');

  /* ── IDs & meta ── */
  const [editId, setEditId] = useState<number | null>(initId ? Number(initId) : null);
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [issueNumber, setIssueNumber] = useState(1);
  const [issueDate, setIssueDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  });

  /* ── §1 Yussi's Note ── */
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');

  /* ── §2 Main Story ── */
  const [mainEnabled, setMainEnabled] = useState(false);
  const [mainBlogId, setMainBlogId] = useState<number | null>(null);
  const [mainBlog, setMainBlog] = useState<BlogMini | null>(null);
  const [mainExcerpt, setMainExcerpt] = useState('');

  /* ── §3 Lunch Box ── */
  const [lunchEnabled, setLunchEnabled] = useState(false);
  const [lunchImage, setLunchImage] = useState('');
  const [lunchTitle, setLunchTitle] = useState('');
  const [lunchBody, setLunchBody] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cropLunchFile, setCropLunchFile] = useState<File | null>(null);
  const [cropSponsorFile, setCropSponsorFile] = useState<File | null>(null);

  /* ── §4 Campus Notes ── */
  const [campusEnabled, setCampusEnabled] = useState(false);
  const [campusTitle, setCampusTitle] = useState('');
  const [campusBody, setCampusBody] = useState('');

  /* ── §5 English with Jin ── */
  const [jinEnabled, setJinEnabled] = useState(false);
  const [jinExpression, setJinExpression] = useState('');
  const [jinBody, setJinBody] = useState('');
  const [jinUrl, setJinUrl] = useState('https://storypress.kr');

  /* ── §6 Local Guide ── */
  const [localsEnabled, setLocalsEnabled] = useState(false);
  const [local1, setLocal1] = useState<LocalItem>({ emoji: '', label: '', title: '', body: '', link: '' });
  const [local2Enabled, setLocal2Enabled] = useState(false);
  const [local2, setLocal2] = useState<LocalItem>({ emoji: '', label: '', title: '', body: '', link: '' });

  /* ── §4.5 Partner Spotlight ── */
  const [sponsorEnabled, setSponsorEnabled] = useState(false);
  const [sponsorLabel, setSponsorLabel] = useState('Partner Spotlight');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorUrl, setSponsorUrl] = useState('');
  const [sponsorImage, setSponsorImage] = useState('');
  const [sponsorBody, setSponsorBody] = useState('');
  const [uploadingSponsor, setUploadingSponsor] = useState(false);

  /* ── §7 From the Archive ── */
  const [archiveEnabled, setArchiveEnabled] = useState(false);
  const [archiveBlogId, setArchiveBlogId] = useState<number | null>(null);
  const [archiveBlog, setArchiveBlog] = useState<BlogMini | null>(null);
  const [archiveExcerpt, setArchiveExcerpt] = useState('');

  /* ── misc ── */
  const [blogs, setBlogs] = useState<BlogMini[]>([]);
  const [subCount, setSubCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  /* ── load data ── */
  useEffect(() => {
    supabase
      .from('blogs')
      .select('id, title, slug, category, date, image_url, meta_description')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setBlogs((data as BlogMini[]) ?? []));

    supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
      .then(({ count }) => setSubCount(count ?? 0));

    supabase
      .from('newsletters')
      .select('issue_number')
      .not('issue_number', 'is', null)
      .order('issue_number', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data[0]?.issue_number) {
          setIssueNumber((data[0].issue_number as number) + 1);
        }
      });

    if (initId) loadDraft(Number(initId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadDraft(id: number) {
    supabase
      .from('newsletters')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data: d }) => {
        if (!d) return;
        setSubject(d.subject ?? '');
        setPreheader(d.preheader ?? '');
        setIssueNumber(d.issue_number ?? 1);
        setIssueDate(d.issue_date ?? '');
        setNoteTitle(d.note_title ?? '');
        setNoteBody(d.note_body ?? '');

        if (d.main_blog_id) {
          setMainEnabled(true);
          setMainBlogId(d.main_blog_id);
          setMainExcerpt(d.main_excerpt ?? '');
        }
        if (d.lunch_title || d.lunch_image) {
          setLunchEnabled(true);
          setLunchImage(d.lunch_image ?? '');
          setLunchTitle(d.lunch_title ?? '');
          setLunchBody(d.lunch_body ?? '');
        }
        if (d.campus_title) {
          setCampusEnabled(true);
          setCampusTitle(d.campus_title ?? '');
          setCampusBody(d.campus_body ?? '');
        }
        if (d.jin_expression) {
          setJinEnabled(true);
          setJinExpression(d.jin_expression ?? '');
          setJinBody(d.jin_body ?? '');
          setJinUrl(d.jin_storypress_url ?? 'https://storypress.kr');
        }
        if (d.locals_json && Array.isArray(d.locals_json) && d.locals_json.length > 0) {
          setLocalsEnabled(true);
          setLocal1(d.locals_json[0] as LocalItem);
          if (d.locals_json.length > 1) {
            setLocal2Enabled(true);
            setLocal2(d.locals_json[1] as LocalItem);
          }
        }
        if (d.has_sponsor) {
          setSponsorEnabled(true);
          setSponsorLabel(d.sponsor_label ?? 'Partner Spotlight');
          setSponsorName(d.sponsor_name ?? '');
          setSponsorUrl(d.sponsor_url ?? '');
          setSponsorImage(d.sponsor_image ?? '');
          setSponsorBody(d.sponsor_body ?? '');
        }
        if (d.archive_blog_id) {
          setArchiveEnabled(true);
          setArchiveBlogId(d.archive_blog_id);
          setArchiveExcerpt(d.archive_excerpt ?? '');
        }
      });
  }

  /* ── after blogs loaded: fill in blog data for loaded draft ── */
  useEffect(() => {
    if (blogs.length === 0) return;
    if (mainBlogId && !mainBlog) {
      const found = blogs.find(b => b.id === mainBlogId);
      if (found) setMainBlog(found);
    }
    if (archiveBlogId && !archiveBlog) {
      const found = blogs.find(b => b.id === archiveBlogId);
      if (found) setArchiveBlog(found);
    }
  }, [blogs, mainBlogId, archiveBlogId, mainBlog, archiveBlog]);

  /* ── handlers ── */
  function handleMainBlogSelect(id: number) {
    const b = blogs.find(bl => bl.id === id);
    setMainBlogId(id);
    setMainBlog(b ?? null);
    if (b && !mainExcerpt) setMainExcerpt(b.meta_description ?? '');
  }

  function handleArchiveBlogSelect(id: number) {
    const b = blogs.find(bl => bl.id === id);
    setArchiveBlogId(id);
    setArchiveBlog(b ?? null);
    if (b && !archiveExcerpt) setArchiveExcerpt(b.meta_description ?? '');
  }

  async function uploadLunchImage(fileOrBlob: File | Blob, fileName?: string) {
    setUploading(true);
    const name = fileName ?? (fileOrBlob instanceof File ? fileOrBlob.name : 'lunch.jpg');
    const ext = name.split('.').pop() ?? 'jpg';
    const path = `newsletters/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('images').upload(path, fileOrBlob);
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      setLunchImage(publicUrl);
    }
    setUploading(false);
  }

  async function uploadSponsorImage(fileOrBlob: File | Blob, fileName?: string) {
    setUploadingSponsor(true);
    const name = fileName ?? (fileOrBlob instanceof File ? fileOrBlob.name : 'sponsor.jpg');
    const ext = name.split('.').pop() ?? 'jpg';
    const path = `newsletters/sponsor-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('images').upload(path, fileOrBlob);
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      setSponsorImage(publicUrl);
    }
    setUploadingSponsor(false);
  }

  /* ── build MailrangiNotesData ── */
  const buildData = useCallback((): MailrangiNotesData => {
    const locals: MailrangiNotesData['locals'] = localsEnabled
      ? [
          { emoji: local1.emoji, label: local1.label, title: local1.title, body: local1.body, link: local1.link || undefined },
          ...(local2Enabled
            ? [{ emoji: local2.emoji, label: local2.label, title: local2.title, body: local2.body, link: local2.link || undefined }]
            : []),
        ]
      : undefined;

    return {
      issueNumber,
      issueDate,
      preheader,
      noteTitle,
      noteBody,
      blog: mainEnabled && mainBlog
        ? { title: mainBlog.title, slug: mainBlog.slug, category: mainBlog.category, date: mainBlog.date, image_url: mainBlog.image_url, excerpt: mainExcerpt }
        : undefined,
      lunch: lunchEnabled ? { image: lunchImage, title: lunchTitle, body: lunchBody } : undefined,
      campus: campusEnabled ? { title: campusTitle, body: campusBody } : undefined,
      jin: jinEnabled ? { expression: jinExpression, body: jinBody, storypressUrl: jinUrl } : undefined,
      locals,
      sponsor: sponsorEnabled && sponsorName
        ? { label: sponsorLabel || undefined, name: sponsorName, url: sponsorUrl || undefined, image: sponsorImage || undefined, body: sponsorBody }
        : undefined,
      archive: archiveEnabled && archiveBlog
        ? { title: archiveBlog.title, slug: archiveBlog.slug, category: archiveBlog.category, image_url: archiveBlog.image_url, excerpt: archiveExcerpt }
        : undefined,
      unsubscribeUrl: 'https://www.mhj.nz/unsubscribe',
    };
  }, [
    issueNumber, issueDate, preheader, noteTitle, noteBody,
    mainEnabled, mainBlog, mainExcerpt,
    lunchEnabled, lunchImage, lunchTitle, lunchBody,
    campusEnabled, campusTitle, campusBody,
    jinEnabled, jinExpression, jinBody, jinUrl,
    localsEnabled, local1, local2Enabled, local2,
    sponsorEnabled, sponsorLabel, sponsorName, sponsorUrl, sponsorImage, sponsorBody,
    archiveEnabled, archiveBlog, archiveExcerpt,
  ]);

  /* ── save draft ── */
  async function saveDraft() {
    if (!subject.trim()) { setError('이메일 제목을 입력해주세요.'); return; }
    setSaving(true); setError('');
    const html = renderMailrangiNotes(buildData());

    const record = {
      subject,
      content: html,
      status: 'draft',
      preheader,
      issue_number: issueNumber,
      issue_date: issueDate,
      note_title: noteTitle,
      note_body: noteBody,
      main_blog_id: mainEnabled ? mainBlogId : null,
      main_excerpt: mainEnabled ? mainExcerpt : null,
      lunch_image: lunchEnabled ? lunchImage : null,
      lunch_title: lunchEnabled ? lunchTitle : null,
      lunch_body: lunchEnabled ? lunchBody : null,
      campus_title: campusEnabled ? campusTitle : null,
      campus_body: campusEnabled ? campusBody : null,
      jin_expression: jinEnabled ? jinExpression : null,
      jin_body: jinEnabled ? jinBody : null,
      jin_storypress_url: jinEnabled ? jinUrl : null,
      locals_json: localsEnabled
        ? [
            { emoji: local1.emoji, label: local1.label, title: local1.title, body: local1.body, link: local1.link },
            ...(local2Enabled ? [{ emoji: local2.emoji, label: local2.label, title: local2.title, body: local2.body, link: local2.link }] : []),
          ]
        : null,
      has_sponsor: sponsorEnabled,
      sponsor_label: sponsorEnabled ? sponsorLabel : null,
      sponsor_name: sponsorEnabled ? sponsorName : null,
      sponsor_url: sponsorEnabled ? sponsorUrl : null,
      sponsor_image: sponsorEnabled ? sponsorImage : null,
      sponsor_body: sponsorEnabled ? sponsorBody : null,
      archive_blog_id: archiveEnabled ? archiveBlogId : null,
      archive_excerpt: archiveEnabled ? archiveExcerpt : null,
    };

    if (editId) {
      await supabase.from('newsletters').update(record).eq('id', editId);
    } else {
      const { data: nl } = await supabase
        .from('newsletters')
        .insert({ ...record, recipient_count: 0 })
        .select('id')
        .single();
      if (nl?.id) {
        setEditId(nl.id);
        window.history.replaceState({}, '', `/mhj-desk/newsletter/new?id=${nl.id}`);
      }
    }
    setSaving(false);
    showToast('임시저장 완료');
  }

  /* ── preview ── */
  function openPreview() {
    setPreviewHtml(renderMailrangiNotes(buildData()));
    setPreview(true);
  }

  /* ── test send ── */
  async function handleTestSend() {
    if (!subject.trim()) { setError('이메일 제목을 입력해주세요.'); return; }
    setTesting(true); setError('');
    const res = await fetch('/api/send-newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        structured_data: buildData(),
        newsletter_id: editId,
        test_email: 'penjunetv@gmail.com',
      }),
    });
    const json = await res.json();
    setTesting(false);
    if (!res.ok) { setError(json.error ?? '테스트 발송 실패'); return; }
    showToast('penjunetv@gmail.com으로 테스트 발송 완료');
  }

  /* ── full send ── */
  async function handleFullSend() {
    if (!subject.trim() || !noteTitle.trim()) {
      setError('이메일 제목과 §1 Yussi\'s Note 제목은 필수입니다.');
      return;
    }
    if (!confirm(`${subCount}명의 활성 구독자에게 발송하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;
    setSending(true); setError('');
    const res = await fetch('/api/send-newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        structured_data: buildData(),
        newsletter_id: editId,
      }),
    });
    const json = await res.json();
    setSending(false);
    if (!res.ok) { setError(json.error ?? '발송 실패'); return; }
    router.push('/mhj-desk/newsletter');
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  /* ─────────────────────────────────────────── render */

  const btnBase: React.CSSProperties = {
    border: 'none', borderRadius: 999, padding: '14px 28px',
    fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
  };

  return (
    <div style={{ padding: '40px 48px', maxWidth: 860, margin: '0 auto' }}>

      {/* header */}
      <div style={{ marginBottom: 36 }}>
        <Link href="/mhj-desk/newsletter" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#94A3B8', textDecoration: 'none', marginBottom: 16 }}>
          <ArrowLeft size={14} /> Newsletter
        </Link>
        <h1 className="font-display font-black uppercase" style={{ fontSize: 40, letterSpacing: '-2px', margin: 0 }}>
          {editId ? `Edit #${issueNumber}` : 'New Newsletter'}
        </h1>
        <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, color: '#94A3B8', textTransform: 'uppercase', marginTop: 6 }}>
          활성 구독자 {subCount}명
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── META ── */}
        <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '20px 24px' }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 16 }}>
            발행 정보
          </p>
          <Row gap={12}>
            <Field label="이슈 번호" flex={0.5}>
              <input
                type="number"
                value={issueNumber}
                onChange={e => setIssueNumber(Number(e.target.value))}
                style={{ ...IS, width: 100 }}
                min={1}
              />
            </Field>
            <Field label="발행일 (예: 2026.03.27)" flex={1}>
              <Input value={issueDate} onChange={setIssueDate} placeholder="2026.03.27" />
            </Field>
          </Row>
          <div style={{ marginTop: 12 }}>
            <Field label="이메일 제목 *">
              <Input value={subject} onChange={setSubject} placeholder="Mairangi Notes #1 — 오클랜드의 봄" />
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="프리헤더 (이메일 앱 미리보기 텍스트)">
              <Input value={preheader} onChange={setPreheader} placeholder="이번 주 마이랑이 베이 소식을 전합니다..." />
            </Field>
          </div>
        </div>

        {/* ── §1 Yussi's Note (required) ── */}
        <SectionCard num={1} title="Yussi's Note">
          <Field label="제목 *">
            <Input value={noteTitle} onChange={setNoteTitle} placeholder="오클랜드의 가을이 시작됩니다" />
          </Field>
          <div style={{ marginTop: 12 }}>
            <Field label="본문">
              <Textarea value={noteBody} onChange={setNoteBody} placeholder="이번 주 유시의 이야기..." rows={4} />
            </Field>
          </div>
        </SectionCard>

        {/* ── §2 Main Story ── */}
        <SectionCard
          num={2} title="Main Story" optional
          enabled={mainEnabled} onToggle={() => setMainEnabled(v => !v)}
        >
          <Field label="저널 글 선택">
            <BlogSelect
              blogs={blogs}
              value={mainBlogId}
              onChange={handleMainBlogSelect}
            />
          </Field>
          {mainBlog && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#F8FAFC', borderRadius: 12, fontSize: 12, color: '#475569', display: 'flex', gap: 12 }}>
              {mainBlog.image_url && (
                <img src={mainBlog.image_url} alt={mainBlog.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              )}
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#1a1a1a', fontSize: 13 }}>{mainBlog.title}</p>
                <p style={{ margin: 0, color: '#818cf8', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{mainBlog.category} · {mainBlog.date}</p>
              </div>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Field label="발췌문 (자동 입력 후 수동 편집 가능)">
              <Textarea value={mainExcerpt} onChange={setMainExcerpt} placeholder="저널 글의 핵심 내용..." rows={3} />
            </Field>
          </div>
        </SectionCard>

        {/* ── §3 Lunch Box ── */}
        <SectionCard
          num={3} title="Lunch Box" badge="MON" optional
          enabled={lunchEnabled} onToggle={() => setLunchEnabled(v => !v)}
        >
          <Row gap={16}>
            {/* Image upload */}
            <div style={{ flex: '0 0 180px' }}>
              <Label>이미지 (선택)</Label>
              <label style={{
                display: 'block', width: 180, height: 140, border: '1.5px dashed #E2E8F0',
                borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
                background: lunchImage ? 'transparent' : '#F8FAFC',
                position: 'relative',
              }}>
                {lunchImage ? (
                  <img src={lunchImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6, color: '#CBD5E1' }}>
                    {uploading
                      ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Upload size={22} />}
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{uploading ? '업로드 중...' : '클릭하여 업로드'}</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setCropLunchFile(f); e.target.value = ''; } }}
                />
              </label>
              {lunchImage && (
                <button
                  type="button"
                  onClick={() => setLunchImage('')}
                  style={{ marginTop: 6, fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  이미지 제거
                </button>
              )}
            </div>
            {/* Title + body */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="제목">
                <Input value={lunchTitle} onChange={setLunchTitle} placeholder="오늘의 도시락 메뉴" />
              </Field>
              <Field label="본문">
                <Textarea value={lunchBody} onChange={setLunchBody} placeholder="오늘은 제육볶음 도시락을..." rows={3} />
              </Field>
            </div>
          </Row>
        </SectionCard>

        {/* ── §4 Campus Notes ── */}
        <SectionCard
          num={4} title="Campus Notes" badge="TUE" optional
          enabled={campusEnabled} onToggle={() => setCampusEnabled(v => !v)}
        >
          <Field label="제목">
            <Input value={campusTitle} onChange={setCampusTitle} placeholder="이번 주 학교 소식" />
          </Field>
          <div style={{ marginTop: 12 }}>
            <Field label="본문">
              <Textarea value={campusBody} onChange={setCampusBody} placeholder="이번 주 캠퍼스에서..." rows={3} />
            </Field>
          </div>
        </SectionCard>

        {/* ── §4.5 Partner Spotlight ── */}
        <SectionCard
          num={0} title="Partner Spotlight" optional
          enabled={sponsorEnabled} onToggle={() => setSponsorEnabled(v => !v)}
        >
          <Row gap={12}>
            <Field label="라벨" flex={1}>
              <Input value={sponsorLabel} onChange={setSponsorLabel} placeholder="Partner Spotlight" />
            </Field>
            <Field label="스폰서명 *" flex={1}>
              <Input value={sponsorName} onChange={setSponsorName} placeholder="브랜드 이름" />
            </Field>
          </Row>
          <div style={{ marginTop: 12 }}>
            <Field label="URL (선택)">
              <Input value={sponsorUrl} onChange={setSponsorUrl} placeholder="https://..." />
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Label>이미지 (선택)</Label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <label style={{
                display: 'block', width: 180, height: 100, border: '1.5px dashed #E2E8F0',
                borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
                background: sponsorImage ? 'transparent' : '#F8FAFC',
                position: 'relative', flexShrink: 0,
              }}>
                {sponsorImage ? (
                  <img src={sponsorImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6, color: '#CBD5E1' }}>
                    {uploadingSponsor
                      ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Upload size={20} />}
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{uploadingSponsor ? '업로드 중...' : '클릭하여 업로드'}</span>
                  </div>
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setCropSponsorFile(f); e.target.value = ''; } }} />
              </label>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Input value={sponsorImage} onChange={setSponsorImage} placeholder="또는 이미지 URL 직접 입력" />
                {sponsorImage && (
                  <button type="button" onClick={() => setSponsorImage('')}
                    style={{ marginTop: 6, fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                    이미지 제거
                  </button>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="소개문 *">
              <Textarea value={sponsorBody} onChange={setSponsorBody} placeholder="스폰서 브랜드 소개 문구 (2-3줄 권장)..." rows={3} />
            </Field>
          </div>
        </SectionCard>

        {/* ── §5 English with Jin ── */}
        <SectionCard
          num={5} title="English with Jin" optional
          enabled={jinEnabled} onToggle={() => setJinEnabled(v => !v)}
        >
          <Field label="이번 주 표현 (예: Can I try?)">
            <Input value={jinExpression} onChange={setJinExpression} placeholder="Can I try?" />
          </Field>
          <div style={{ marginTop: 12 }}>
            <Field label="설명">
              <Textarea value={jinBody} onChange={setJinBody} placeholder="이 표현은..." rows={3} />
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="StoryPress URL">
              <Input value={jinUrl} onChange={setJinUrl} placeholder="https://storypress.kr/..." />
            </Field>
          </div>
        </SectionCard>

        {/* ── §6 Local Guide ── */}
        <SectionCard
          num={6} title="Local Guide" optional
          enabled={localsEnabled} onToggle={() => setLocalsEnabled(v => !v)}
        >
          {/* Card 1 */}
          <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 12, marginBottom: 12 }}>
            <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: '#64748B' }}>카드 1</p>
            <Row gap={8}>
              <Field label="이모지" flex={0.3}>
                <Input value={local1.emoji} onChange={v => setLocal1(p => ({ ...p, emoji: v }))} placeholder="🌿" />
              </Field>
              <Field label="라벨 (예: 이번 주말 행사)" flex={1}>
                <Input value={local1.label} onChange={v => setLocal1(p => ({ ...p, label: v }))} placeholder="이번 주말 행사" />
              </Field>
            </Row>
            <div style={{ marginTop: 8 }}>
              <Field label="제목">
                <Input value={local1.title} onChange={v => setLocal1(p => ({ ...p, title: v }))} placeholder="오클랜드 파머스 마켓" />
              </Field>
            </div>
            <div style={{ marginTop: 8 }}>
              <Field label="설명">
                <Textarea value={local1.body} onChange={v => setLocal1(p => ({ ...p, body: v }))} rows={2} />
              </Field>
            </div>
            <div style={{ marginTop: 8 }}>
              <Field label="링크 (선택)">
                <Input value={local1.link} onChange={v => setLocal1(p => ({ ...p, link: v }))} placeholder="https://..." />
              </Field>
            </div>
          </div>

          {/* Card 2 toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: local2Enabled ? 12 : 0 }}>
            <button
              type="button"
              onClick={() => setLocal2Enabled(v => !v)}
              style={{
                ...btnBase,
                padding: '8px 16px', fontSize: 10,
                background: local2Enabled ? '#1a1a1a' : '#F1F5F9',
                color: local2Enabled ? 'white' : '#94A3B8',
              }}
            >
              {local2Enabled ? '카드 2 제거' : '+ 카드 2 추가'}
            </button>
          </div>
          {local2Enabled && (
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 12 }}>
              <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: '#64748B' }}>카드 2</p>
              <Row gap={8}>
                <Field label="이모지" flex={0.3}>
                  <Input value={local2.emoji} onChange={v => setLocal2(p => ({ ...p, emoji: v }))} placeholder="🎵" />
                </Field>
                <Field label="라벨" flex={1}>
                  <Input value={local2.label} onChange={v => setLocal2(p => ({ ...p, label: v }))} placeholder="추천 맛집" />
                </Field>
              </Row>
              <div style={{ marginTop: 8 }}>
                <Field label="제목">
                  <Input value={local2.title} onChange={v => setLocal2(p => ({ ...p, title: v }))} />
                </Field>
              </div>
              <div style={{ marginTop: 8 }}>
                <Field label="설명">
                  <Textarea value={local2.body} onChange={v => setLocal2(p => ({ ...p, body: v }))} rows={2} />
                </Field>
              </div>
              <div style={{ marginTop: 8 }}>
                <Field label="링크 (선택)">
                  <Input value={local2.link} onChange={v => setLocal2(p => ({ ...p, link: v }))} placeholder="https://..." />
                </Field>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── §7 From the Archive ── */}
        <SectionCard
          num={7} title="From the Archive" optional
          enabled={archiveEnabled} onToggle={() => setArchiveEnabled(v => !v)}
        >
          <Field label="저널 글 선택">
            <BlogSelect
              blogs={blogs}
              value={archiveBlogId}
              onChange={handleArchiveBlogSelect}
            />
          </Field>
          {archiveBlog && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#F8FAFC', borderRadius: 12, fontSize: 12, color: '#475569', display: 'flex', gap: 12 }}>
              {archiveBlog.image_url && (
                <img src={archiveBlog.image_url} alt={archiveBlog.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              )}
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#1a1a1a', fontSize: 13 }}>{archiveBlog.title}</p>
                <p style={{ margin: 0, color: '#818cf8', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{archiveBlog.category} · {archiveBlog.date}</p>
              </div>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Field label="발췌문">
              <Textarea value={archiveExcerpt} onChange={setArchiveExcerpt} placeholder="아카이브 글의 핵심 내용..." rows={2} />
            </Field>
          </div>
        </SectionCard>

        {/* ── ERROR ── */}
        {error && (
          <div style={{ padding: '14px 18px', background: '#FEF2F2', borderRadius: 12, fontSize: 13, color: '#EF4444', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 60 }}>
          <button
            onClick={saveDraft}
            disabled={saving}
            style={{ ...btnBase, background: '#F1F5F9', color: '#1a1a1a' }}
          >
            {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? '저장 중...' : '임시저장'}
          </button>

          <button
            onClick={openPreview}
            style={{ ...btnBase, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}
          >
            <Eye size={13} /> 미리보기
          </button>

          <button
            onClick={handleTestSend}
            disabled={testing}
            style={{ ...btnBase, background: '#EFF6FF', color: '#1D4ED8' }}
          >
            {testing && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            <FlaskConical size={13} />
            {testing ? '발송 중...' : '테스트 발송'}
          </button>

          <button
            onClick={handleFullSend}
            disabled={sending}
            style={{ ...btnBase, background: '#1a1a1a', color: 'white' }}
          >
            {sending && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            <Send size={13} />
            {sending ? '발송 중...' : `전체 발송 (${subCount}명)`}
          </button>

          <button
            onClick={() => router.back()}
            style={{ ...btnBase, background: 'transparent', color: '#94A3B8' }}
          >
            취소
          </button>
        </div>
      </div>

      {/* ── Preview Modal ── */}
      {preview && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setPreview(false)}
        >
          <div
            style={{ background: 'white', borderRadius: 24, maxWidth: 680, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', flexShrink: 0 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#94A3B8' }}>Email Preview</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>실제 이메일에서 보이는 모습</p>
              </div>
              <button
                onClick={() => setPreview(false)}
                style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
              >
                <X size={15} />
              </button>
            </div>
            <iframe
              srcDoc={previewHtml}
              title="이메일 미리보기"
              style={{ width: '100%', flex: 1, border: 'none', background: '#F1F5F9', minHeight: 500 }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: 'white', padding: '12px 24px',
          borderRadius: 999, fontSize: 13, fontWeight: 700, zIndex: 2000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        }}>
          {toast}
        </div>
      )}

      {cropLunchFile && (
        <ImageCropModal
          imageFile={cropLunchFile}
          onCropComplete={(blob, name) => { setCropLunchFile(null); uploadLunchImage(blob, name); }}
          onSkip={(file) => { setCropLunchFile(null); uploadLunchImage(file); }}
          onCancel={() => setCropLunchFile(null)}
        />
      )}

      {cropSponsorFile && (
        <ImageCropModal
          imageFile={cropSponsorFile}
          onCropComplete={(blob, name) => { setCropSponsorFile(null); uploadSponsorImage(blob, name); }}
          onSkip={(file) => { setCropSponsorFile(null); uploadSponsorImage(file); }}
          onCancel={() => setCropSponsorFile(null)}
        />
      )}
    </div>
  );
}
