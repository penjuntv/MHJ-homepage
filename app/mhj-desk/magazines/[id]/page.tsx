'use client';

import React, {
  useEffect, useState, useRef, useCallback, lazy, Suspense,
} from 'react';
import SafeImage from '@/components/SafeImage';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';
import type { Magazine, Article, ArticlePage, DirectoryItem } from '@/lib/types';
import {
  ChevronLeft, Plus, Trash2, X, Upload, Loader2, Check,
  ChevronUp, ChevronDown, ExternalLink, BookOpen, AlertCircle,
  FileText, Image as ImageIcon, ZoomIn, ZoomOut,
} from 'lucide-react';
import { ACCENT_PRESETS, COVER_FILTERS, DEFAULT_CONTRIBUTORS, SEASONAL_ACCENTS } from '@/lib/magazine-themes';
import ImageCropModal from '@/components/admin/ImageCropModal';
import CoverPreview from '@/components/magazine/CoverPreview';
import TocPreview from '@/components/magazine/TocPreview';
import MagazinePage from '@/components/magazine/MagazinePage';
import ArticlePageRenderer from '@/components/magazine/ArticlePageRenderer';
import DownloadBtn from '@/components/DownloadBtn';
import type { ArticlePreviewData, StyleOverrides } from '@/components/magazine/templates/shared';
import { TEMPLATE_PHOTO_COUNT } from '@/components/magazine/templates/shared';
import StyleOverridePanel from '@/components/admin/StyleOverridePanel';

const TipTapEditor = lazy(() => import('@/components/TipTapEditor'));

/* ─── 타입 ─── */
type ArticleType   = 'cover' | 'contents' | 'article';
type ArticleStatus = 'draft' | 'complete' | 'published';
type TabKey        = 'cover' | 'articles' | 'spread';

type ArticleInput = {
  magazine_id: string;
  title: string;
  author: string;
  date: string;
  image_url: string;
  content: string;
  pdf_url: string;
  article_type: ArticleType;
  sort_order: number;
  template: string;
  article_status: ArticleStatus;
  article_images: string[];
  image_positions: string[];
  style_overrides: StyleOverrides;
  // 2D: 템플릿 전용 입력 필드
  kicker: string;
  subtitle: string;
  sidebar_title: string;
  sidebar_body: string;
  directory_items: DirectoryItem[];
  quote_text: string;
  quote_attribution: string;
};

/* ─── 템플릿 카테고리 (Phase 1 v2) ───
   Phase 2-5에서 각 템플릿의 실제 렌더러 구현 예정.
   현재 렌더링은 classic fallback (sidebar/free 제외 — 이미 구현됨). */
type TemplateMeta = { key: string; label: string; desc: string; photos: number };
const TEMPLATE_CATEGORIES: { key: string; label: string; templates: TemplateMeta[] }[] = [
  {
    key: 'corner', label: '고정 코너',
    templates: [
      { key: 'mums-note',    label: "Mum's Note",   desc: '여는 에세이',   photos: 1 },
      { key: 'little-notes', label: 'Little Notes', desc: '닫는 인용',     photos: 1 },
    ],
  },
  {
    key: 'main', label: '메인 기사',
    templates: [
      { key: 'middle',       label: 'Middle',       desc: '상단 풀블리드',   photos: 1 },
      { key: 'feature-half', label: 'Feature Half', desc: '하단 풀블리드',   photos: 1 },
      { key: 'left',         label: 'Left',         desc: '좌측 이미지 3장', photos: 3 },
      { key: 'right',        label: 'Right',        desc: '우측 이미지 3장', photos: 3 },
    ],
  },
  {
    key: 'special', label: '그달의 사진',
    templates: [
      { key: 'special',      label: 'Special',      desc: '9장 그리드',      photos: 9 },
    ],
  },
  {
    key: 'research', label: '리서치',
    templates: [
      { key: 'sidebar',      label: 'Sidebar',      desc: '본문 + 인포블록', photos: 0 },
    ],
  },
  {
    key: 'free', label: '자유 편집',
    templates: [
      { key: 'free',         label: 'Free',         desc: '사진 없는 에세이', photos: 0 },
    ],
  },
];

/* 평탄화 (label lookup 호환) */
const TEMPLATE_META: TemplateMeta[] = TEMPLATE_CATEGORIES.flatMap(c => c.templates);

/* Legacy 값 — 드롭다운에서 숨기되 기존 기사가 이 값을 가지면 안내 표시 */
const LEGACY_TEMPLATES = [
  'text-only', 'essay', 'classic', 'split', 'photo-hero', 'photo-essay',
  'story-2', 'cover', 'title-card', 'directory', 'pull-quote',
];

const STATUS_CONFIG: Record<ArticleStatus, { label: string; bg: string; color: string }> = {
  draft:     { label: '초안',   bg: '#F1F5F9', color: '#64748B' },
  complete:  { label: '완료',   bg: '#FEF9C3', color: '#A16207' },
  published: { label: '발행됨', bg: '#DCFCE7', color: '#16A34A' },
};

const TYPE_CONFIG: Record<ArticleType, { label: string; bg: string; color: string }> = {
  cover:    { label: 'COVER',    bg: '#F59E0B', color: 'white' },
  contents: { label: 'CONTENTS', bg: '#4F46E5', color: 'white' },
  article:  { label: 'ARTICLE',  bg: '#94A3B8', color: 'white' },
};

const TODAY = new Date()
  .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  .replace(/\. /g, '.').replace(/\.$/, '');

const EMPTY_FORM = (magazineId: string, nextOrder: number): ArticleInput => ({
  magazine_id: magazineId, title: '', author: '', date: TODAY,
  image_url: '', content: '', pdf_url: '',
  article_type: 'article', sort_order: nextOrder,
  template: 'classic', article_status: 'draft', article_images: [], image_positions: [],
  style_overrides: {},
  kicker: '', subtitle: '',
  sidebar_title: '', sidebar_body: '',
  directory_items: [],
  quote_text: '', quote_attribution: '',
});

/* ─── 공통 스타일 ─── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '12px',
  border: '1px solid #F1F5F9', background: '#F8FAFC',
  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', color: '#1A1A1A',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 900,
  letterSpacing: '3px', color: '#94A3B8', textTransform: 'uppercase',
  marginBottom: '5px',
};

/* ─── 템플릿 렌더 헬퍼 ───
   Admin 미리보기와 라이브 렌더가 동일 경로를 쓰도록 ArticlePageRenderer로 위임.
   이전에는 별도 switch 유지 → Phase 2에서 새 템플릿 추가할 때 한 쪽만 업데이트돼
   Admin 미리보기가 default(ClassicTemplate)로 빠지는 이슈 발생. */
function renderTemplate(
  tpl: string,
  artData: ArticlePreviewData,
  accentColor: string,
  bgColor?: string,
  hideTitle?: boolean,
) {
  return (
    <ArticlePageRenderer
      template={tpl}
      title={artData.title}
      author={artData.author}
      content={artData.content}
      images={(artData.article_images ?? []).filter(Boolean) as string[]}
      imagePositions={artData.image_positions ?? []}
      captions={artData.image_captions ?? []}
      accentColor={accentColor}
      bgColor={bgColor}
      hideTitle={hideTitle}
      styleOverrides={artData.style_overrides}
      kicker={artData.kicker}
      subtitle={artData.subtitle}
      sidebarTitle={artData.sidebar_title}
      sidebarBody={artData.sidebar_body}
      directoryItems={artData.directory_items}
      quoteText={artData.quote_text}
      quoteAttribution={artData.quote_attribution}
    />
  );
}

/* ════════════════════════════════════════════
   메인 페이지
   ════════════════════════════════════════════ */
export default function MagazineDetailPage() {
  const { id } = useParams<{ id: string }>();

  /* ─── 기본 데이터 ─── */
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState('');

  /* ─── 탭 ─── */
  const [tab, setTab] = useState<TabKey>('cover');

  /* ─── 이슈 정보 ─── */
  const [magForm, setMagForm] = useState({
    title: '', editor: '', year: '', month_name: '', pdf_url: '', image_url: '',
    color_theme: 'ocean', cover_subtitle: '', contributors: [] as string[],
    accent_color: '#1A1A1A', bg_color: '#F5F0EA', cover_filter: 'none', cover_copy: '',
    cover_images: [] as string[], issue_number: '01',
  });
  const [savingMag, setSavingMag]               = useState(false);
  const [uploadingMagPdf, setUploadingMagPdf]   = useState(false);
  const [uploadingMagCover, setUploadingMagCover] = useState(false);
  const [uploadingExtraImg, setUploadingExtraImg] = useState(false);
  const [cropCoverFile, setCropCoverFile] = useState<File | null>(null);
  const [newContributor, setNewContributor]      = useState('');

  /* ─── 인라인 기사 편집 ─── */
  const [selectedArtId, setSelectedArtId]  = useState<number | null>(null);
  const [inlineForm, setInlineForm]        = useState<ArticleInput | null>(null);
  const [inlineIsNew, setInlineIsNew]      = useState(false);
  const [savingArticle, setSavingArticle]  = useState(false);
  const [formError, setFormError]          = useState('');
  const [uploadingContent, setUploadingContent] = useState(false);
  const [uploadingSlotIdx, setUploadingSlotIdx] = useState<number | null>(null);
  const [cropSlotFile, setCropSlotFile] = useState<{ file: File; slotIdx: number } | null>(null);
  const [cropPageSlotFile, setCropPageSlotFile] = useState<{ file: File; pageIdx: number; slotIdx: number } | null>(null);

  /* ─── 추가 페이지 (article_pages) ─── */
  const [articlePages, setArticlePages] = useState<ArticlePage[]>([]);
  const [savingPages, setSavingPages] = useState(false);
  const [uploadingPageSlot, setUploadingPageSlot] = useState<{ pageIdx: number; slotIdx: number } | null>(null);
  const [focusedPageIdx, setFocusedPageIdx] = useState<number | null>(null); // null=Page1, 0+=추가페이지

  /* ─── 정렬 ─── */
  const [reordering, setReordering] = useState(false);

  /* ─── 스프레드 모달 ─── */
  type SpreadModalItem = { label: string; content: React.ReactNode };
  const [spreadModal, setSpreadModal] = useState<{ pages: SpreadModalItem[]; idx: number } | null>(null);
  const [modalZoom, setModalZoom] = useState(100);

  /* ─── refs ─── */
  const magPdfRef       = useRef<HTMLInputElement>(null);
  const magCoverRef     = useRef<HTMLInputElement>(null);
  const extraImgRef     = useRef<HTMLInputElement>(null);
  const contentFileRef  = useRef<HTMLInputElement>(null);
  const slotImgRef      = useRef<HTMLInputElement>(null);
  const pendingSlot     = useRef<number>(0);
  const pageSlotRef     = useRef<HTMLInputElement>(null);
  const pendingPageSlot = useRef<{ pageIdx: number; slotIdx: number }>({ pageIdx: 0, slotIdx: 0 });

  /* ─── Tab 2 live preview ref ─── */
  const previewDivRef = useRef<HTMLDivElement>(null);

  /* ─── 스프레드 스크롤 ref (마우스 휠 → 가로 스크롤) ─── */
  const spreadScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = spreadScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [tab]); // tab이 'spread'로 바뀔 때마다 재연결

  /* ─── 데이터 로드 ─── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: mag }, { data: arts }] = await Promise.all([
      supabase.from('magazines').select('*').eq('id', id).single(),
      supabase.from('articles').select('*').eq('magazine_id', id).order('sort_order', { ascending: true }),
    ]);
    setMagazine(mag);
    setArticles(arts ?? []);
    if (mag) setMagForm({
      title: mag.title, editor: mag.editor, year: mag.year,
      month_name: mag.month_name, pdf_url: mag.pdf_url ?? '',
      image_url: mag.image_url ?? '', color_theme: mag.color_theme ?? 'ocean',
      cover_subtitle: mag.cover_subtitle ?? '',
      contributors: mag.contributors ?? [],
      accent_color: mag.accent_color ?? '#1A1A1A',
      bg_color: mag.bg_color ?? '#F5F0EA',
      cover_filter: mag.cover_filter ?? 'none',
      cover_copy: mag.cover_copy ?? '',
      cover_images: mag.cover_images ?? [],
      issue_number: mag.issue_number ?? '01',
    });
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── 추가 페이지 로드 ─── */
  const fetchArticlePages = useCallback(async (artId: number) => {
    const { data } = await supabase
      .from('article_pages')
      .select('*')
      .eq('article_id', artId)
      .order('page_number', { ascending: true });
    setArticlePages((data ?? []) as ArticlePage[]);
  }, []);

  useEffect(() => {
    if (selectedArtId && !inlineIsNew) {
      fetchArticlePages(selectedArtId);
    } else {
      setArticlePages([]);
    }
  }, [selectedArtId, inlineIsNew, fetchArticlePages]);

  /* ─── 토스트 ─── */
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  /* ─── 이슈 정보 저장 ─── */
  async function saveMagazine() {
    if (!magazine) return;
    if (!magForm.issue_number.trim()) { showToast('이슈 번호를 입력해주세요.'); return; }
    setSavingMag(true);
    const { error } = await supabase.from('magazines').update({
      title: magForm.title, editor: magForm.editor, year: magForm.year,
      month_name: magForm.month_name, pdf_url: magForm.pdf_url || null,
      image_url: magForm.image_url || null, color_theme: magForm.color_theme,
      cover_subtitle: magForm.cover_subtitle, contributors: magForm.contributors,
      accent_color: magForm.accent_color, bg_color: magForm.bg_color,
      cover_filter: magForm.cover_filter,
      cover_copy: magForm.cover_copy, cover_images: magForm.cover_images,
      issue_number: magForm.issue_number,
    }).eq('id', magazine.id);
    if (error) { showToast('저장 실패: ' + error.message); }
    else {
      showToast('표지 정보가 저장되었습니다.');
      await fetchData();
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
            paths: ['/magazine', `/magazine/${id}`, '/'],
          }),
        });
      } catch { /* revalidation 실패해도 저장은 성공 */ }
    }
    setSavingMag(false);
  }

  /* ─── PDF 관련 업로드 ─── */
  async function uploadMagPdf(file: File) {
    setUploadingMagPdf(true);
    const path = `magazines/${id}/magazine_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) { showToast('업로드 실패: ' + error.message); } else {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      setMagForm(p => ({ ...p, pdf_url: publicUrl }));
    }
    setUploadingMagPdf(false);
  }

  async function uploadMagCover(fileOrBlob: File | Blob, fileName?: string) {
    setUploadingMagCover(true);
    const name = fileName ?? (fileOrBlob instanceof File ? fileOrBlob.name : 'cover.jpg');
    const path = `magazines/${id}/cover_${Date.now()}.${name.split('.').pop()}`;
    const { error } = await supabase.storage.from('images').upload(path, fileOrBlob, { upsert: true });
    if (error) { showToast('업로드 실패: ' + error.message); } else {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      setMagForm(p => ({ ...p, image_url: publicUrl }));
    }
    setUploadingMagCover(false);
  }

  async function uploadExtraCoverImage(file: File) {
    setUploadingExtraImg(true);
    const path = `magazines/${id}/extra_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) { showToast('업로드 실패: ' + error.message); } else {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      setMagForm(p => ({ ...p, cover_images: [...(p.cover_images ?? []), publicUrl] }));
    }
    setUploadingExtraImg(false);
  }

  /* ─── 기사 이미지 업로드 ─── */
  async function uploadContentFile(file: File) {
    setUploadingContent(true);
    const path = `articles/${Date.now()}_content.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) { setFormError('파일 업로드 실패: ' + error.message); } else {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      setInlineForm(p => p ? { ...p, pdf_url: publicUrl } : p);
    }
    setUploadingContent(false);
  }

  async function uploadArticleSlotImage(fileOrBlob: File | Blob, slotIdx: number, fileName?: string) {
    setUploadingSlotIdx(slotIdx);
    const name = fileName ?? (fileOrBlob instanceof File ? fileOrBlob.name : 'slot.jpg');
    const path = `articles/${Date.now()}_slot${slotIdx}.${name.split('.').pop()}`;
    const { error } = await supabase.storage.from('images').upload(path, fileOrBlob);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      setInlineForm(p => {
        if (!p) return p;
        const imgs = [...(p.article_images ?? [])];
        imgs[slotIdx] = publicUrl;
        return { ...p, article_images: imgs };
      });
    }
    setUploadingSlotIdx(null);
  }

  /* ─── 기사 저장 ─── */
  async function saveArticle() {
    if (!inlineForm) return;
    if (!inlineForm.title) { setFormError('제목은 필수입니다.'); return; }
    setSavingArticle(true);
    setFormError('');
    // 기사 사진 첫 번째를 대표 image_url로 자동 설정
    const firstImg = (inlineForm.article_images ?? []).filter(Boolean)[0] ?? inlineForm.image_url ?? '';
    const formToSave = { ...inlineForm, image_url: firstImg };

    if (!inlineIsNew && selectedArtId) {
      const { error } = await supabase.from('articles').update(formToSave).eq('id', selectedArtId);
      if (error) { setFormError(error.message); setSavingArticle(false); return; }
      setArticles(prev => prev.map(a => a.id === selectedArtId ? ({ ...a, ...formToSave } as Article) : a));
      showToast('기사가 저장되었습니다.');
    } else {
      const { data, error } = await supabase.from('articles').insert(formToSave).select().single();
      if (error) { setFormError(error.message); setSavingArticle(false); return; }
      if (data) { setArticles(prev => [...prev, data]); setSelectedArtId(data.id); setInlineIsNew(false); }
      showToast('기사가 추가되었습니다.');
    }
    try {
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
          paths: ['/magazine', `/magazine/${id}`, '/'],
        }),
      });
    } catch { /* revalidation 실패해도 저장은 성공 */ }
    setSavingArticle(false);
  }

  /* ─── 추가 페이지 저장 ─── */
  async function saveArticlePages() {
    if (!selectedArtId) return;
    setSavingPages(true);
    await supabase.from('article_pages').delete().eq('article_id', selectedArtId);
    if (articlePages.length > 0) {
      const rows = articlePages.map((p, idx) => ({
        article_id: selectedArtId,
        page_number: idx + 1,
        template: p.template,
        content: p.content,
        images: p.images,
        image_positions: p.image_positions ?? [],
        caption: p.caption ?? null,
        captions: p.captions ?? [],
      }));
      const { error } = await supabase.from('article_pages').insert(rows);
      if (error) { showToast('페이지 저장 실패: ' + error.message); setSavingPages(false); return; }
    }
    showToast('추가 페이지가 저장되었습니다.');
    setSavingPages(false);
    await fetchArticlePages(selectedArtId);
  }

  /* ─── 페이지 이미지 업로드 ─── */
  async function uploadPageSlotImage(fileOrBlob: File | Blob, pageIdx: number, slotIdx: number, fileName?: string) {
    setUploadingPageSlot({ pageIdx, slotIdx });
    const name = fileName ?? (fileOrBlob instanceof File ? fileOrBlob.name : 'slot.jpg');
    const path = `articles/${Date.now()}_page${pageIdx}_slot${slotIdx}.${name.split('.').pop()}`;
    const { error } = await supabase.storage.from('images').upload(path, fileOrBlob);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      setArticlePages(prev => prev.map((p, i) => {
        if (i !== pageIdx) return p;
        const imgs = [...(p.images ?? [])];
        imgs[slotIdx] = publicUrl;
        return { ...p, images: imgs };
      }));
    }
    setUploadingPageSlot(null);
  }

  /* ─── 콘텐츠 파일 삭제 ─── */
  async function deleteContentFile() {
    if (!inlineForm?.pdf_url) return;
    if (!confirm('콘텐츠 파일을 삭제하시겠습니까?')) return;

    const url = inlineForm.pdf_url;

    // 기존 기사(DB 레코드 있음)면 DB 먼저 업데이트
    if (!inlineIsNew && selectedArtId) {
      const { error: dbErr } = await supabase
        .from('articles')
        .update({ pdf_url: null })
        .eq('id', selectedArtId);
      if (dbErr) { showToast('DB 업데이트 실패: ' + dbErr.message); return; }
    }

    // Storage에서 삭제
    const marker = '/storage/v1/object/public/images/';
    const storagePath = url.includes(marker) ? url.split(marker)[1] : null;
    if (storagePath) {
      const { error: stErr } = await supabase.storage.from('images').remove([storagePath]);
      if (stErr) showToast('Storage 삭제 실패: ' + stErr.message);
    }

    setInlineForm(p => p ? { ...p, pdf_url: '' } : p);
    showToast('파일이 삭제되었습니다.');
  }

  /* ─── 기사 삭제 ─── */
  async function deleteArticle(artId: number) {
    if (!confirm('이 기사를 삭제하시겠습니까?')) return;
    await supabase.from('articles').delete().eq('id', artId);
    setArticles(prev => prev.filter(a => a.id !== artId));
    if (selectedArtId === artId) { setSelectedArtId(null); setInlineForm(null); }
    showToast('기사가 삭제되었습니다.');
  }

  /* ─── 기사 순서 변경 ─── */
  async function moveArticle(artId: number, dir: 'up' | 'down') {
    const sorted = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = sorted.findIndex(a => a.id === artId);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    setReordering(true);
    const a = sorted[idx]; const b = sorted[swapIdx];
    const aOrder = a.sort_order ?? idx; const bOrder = b.sort_order ?? swapIdx;
    await Promise.all([
      supabase.from('articles').update({ sort_order: bOrder }).eq('id', a.id),
      supabase.from('articles').update({ sort_order: aOrder }).eq('id', b.id),
    ]);
    setArticles(prev => prev.map(art => {
      if (art.id === a.id) return { ...art, sort_order: bOrder };
      if (art.id === b.id) return { ...art, sort_order: aOrder };
      return art;
    }));
    setReordering(false);
  }

  /* ─── 기사 선택 ─── */
  function selectArticle(article: Article) {
    setSelectedArtId(article.id);
    setInlineIsNew(false);
    setFocusedPageIdx(null);
    setFormError('');
    setInlineForm({
      magazine_id: article.magazine_id,
      title: article.title, author: article.author, date: article.date,
      image_url: article.image_url, content: article.content,
      pdf_url: (article as Article & { pdf_url?: string }).pdf_url ?? '',
      article_type: (article.article_type as ArticleType) ?? 'article',
      sort_order: article.sort_order ?? 0,
      template: (article as Article & { template?: string }).template ?? 'classic',
      article_status: ((article as Article & { article_status?: string }).article_status as ArticleStatus) ?? 'draft',
      article_images: (article as Article & { article_images?: string[] }).article_images ?? [],
      image_positions: (article as Article & { image_positions?: string[] }).image_positions ?? [],
      style_overrides: (article.style_overrides as StyleOverrides) ?? {},
      kicker: article.kicker ?? '',
      subtitle: article.subtitle ?? '',
      sidebar_title: article.sidebar_title ?? '',
      sidebar_body: article.sidebar_body ?? '',
      directory_items: article.directory_items ?? [],
      quote_text: article.quote_text ?? '',
      quote_attribution: article.quote_attribution ?? '',
    });
  }

  function openNewArticle() {
    const nextOrder = articles.length > 0
      ? Math.max(...articles.map(a => a.sort_order ?? 0)) + 1 : 1;
    setSelectedArtId(null);
    setInlineIsNew(true);
    setInlineForm(EMPTY_FORM(id, nextOrder));
    setFormError('');
    setFocusedPageIdx(null);
  }

  const sortedArticles = [...articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const hasPdf = !!(magazine?.pdf_url);
  const accentCol = magazine?.accent_color ?? '#1A1A1A';

  /* ─── 로딩 ─── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 size={24} color="#CBD5E1" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (!magazine) return (
    <div style={{ padding: '48px' }}>
      <p style={{ color: '#64748B' }}>매거진을 찾을 수 없습니다.</p>
      <Link href="/mhj-desk/magazines" style={{ marginTop: '16px', display: 'inline-block', color: '#4F46E5' }}>← 목록으로</Link>
    </div>
  );

  const photoCount = inlineForm ? (TEMPLATE_PHOTO_COUNT[inlineForm.template] ?? 0) : 0;
  const bgCol = magazine?.bg_color ?? '#F5F0EA';

  return (
    <div style={{ paddingBottom: '80px' }}>

      {/* ─── 전역 스타일 ─── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideRight { from { transform: translateX(16px); opacity: 0; } to { transform: none; opacity: 1; } }
        @media (max-width: 1023px) {
          .article-edit-grid { grid-template-columns: 1fr !important; }
          .article-preview-panel { position: static !important; max-height: none !important; }
        }
      `}</style>

      {/* ─── 상단 바 ─── */}
      <div style={{ padding: '20px clamp(24px,4vw,48px) 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/mhj-desk/magazines" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textDecoration: 'none' }}>
            <ChevronLeft size={14} /> 매거진 목록
          </Link>
          <div>
            <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '4px', color: '#CBD5E1', textTransform: 'uppercase', display: 'block' }}>Magazine Issue</span>
            <h1 className="font-display font-black" style={{ fontSize: 'clamp(20px, 3vw, 32px)', letterSpacing: '-1px', margin: 0, lineHeight: 1 }}>
              {magazine.title}
            </h1>
          </div>
        </div>
        <a href={`/magazine/${id}`} target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1A1A1A', color: 'white', borderRadius: '999px', padding: '10px 20px', fontSize: '11px', fontWeight: 900, letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
          <ExternalLink size={13} /> 뷰어로 보기
        </a>
      </div>

      {/* ─── 탭 네비게이션 ─── */}
      <div style={{ padding: '0 clamp(24px,4vw,48px)', borderBottom: '1px solid #F1F5F9', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([
            { key: 'cover',    label: '📋 표지 & 설정' },
            { key: 'articles', label: '✍️ 기사 편집' },
            { key: 'spread',   label: '🔍 전체 미리보기' },
          ] as { key: TabKey; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '12px 20px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px',
              border: 'none', cursor: 'pointer', borderRadius: '12px 12px 0 0',
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#1A1A1A' : '#94A3B8',
              borderBottom: tab === t.key ? '2px solid #4F46E5' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          탭 1: 표지 & 설정
          ══════════════════════════════════════════ */}
      {tab === 'cover' && (
        <div style={{ padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '32px', alignItems: 'start', minWidth: 0 }}>

            {/* ─── 좌: 폼 ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* 기본 정보 */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #F1F5F9' }}>
                <p style={sectionTitle}>기본 정보</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>이슈 제목</label>
                    <input value={magForm.title} onChange={e => setMagForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div><label style={labelStyle}>연도</label><input value={magForm.year} onChange={e => setMagForm(p => ({ ...p, year: e.target.value }))} style={inputStyle} /></div>
                    <div><label style={labelStyle}>월</label><input value={magForm.month_name} onChange={e => setMagForm(p => ({ ...p, month_name: e.target.value }))} style={inputStyle} /></div>
                    <div><label style={labelStyle}>이슈 번호</label><input value={magForm.issue_number} onChange={e => setMagForm(p => ({ ...p, issue_number: e.target.value }))} style={inputStyle} /></div>
                  </div>
                  <div><label style={labelStyle}>에디터</label><select value={magForm.editor} onChange={e => setMagForm(p => ({ ...p, editor: e.target.value }))} style={inputStyle}>{['PeNnY', 'Yussi', 'Min', 'Hyun', 'Jin'].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                  <div>
                    <label style={labelStyle}>표지 카피</label>
                    <textarea value={magForm.cover_copy} onChange={e => setMagForm(p => ({ ...p, cover_copy: e.target.value }))} rows={2} placeholder="이번 호 한 줄 카피..." style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              {/* 커버 이미지 캐러셀 */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #F1F5F9' }}>
                <p style={sectionTitle}>커버 이미지 목록</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {(magForm.cover_images ?? []).map((url, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '40px', height: '52px', borderRadius: '4px', overflow: 'hidden', background: '#F1F5F9', flexShrink: 0, position: 'relative' }}>
                        {url ? <SafeImage src={url} alt="" fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#E2E8F0' }} />}
                      </div>
                      <input value={url} onChange={e => { const imgs = [...(magForm.cover_images ?? [])]; imgs[idx] = e.target.value; setMagForm(p => ({ ...p, cover_images: imgs })); }} placeholder="이미지 URL" style={{ ...inputStyle, flex: 1 }} />
                      <button type="button" onClick={() => setMagForm(p => ({ ...p, cover_images: (p.cover_images ?? []).filter((_, i) => i !== idx) }))} style={{ padding: '7px', background: 'white', border: '1px solid #FEE2E2', borderRadius: '8px', color: '#EF4444', cursor: 'pointer', flexShrink: 0, display: 'flex' }}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" onClick={() => extraImgRef.current?.click()} disabled={uploadingExtraImg} style={ghostBtn}>
                    {uploadingExtraImg ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={11} />}
                    이미지 업로드
                  </button>
                  <button type="button" onClick={() => setMagForm(p => ({ ...p, cover_images: [...(p.cover_images ?? []), ''] }))} style={ghostBtn}>
                    <Plus size={11} /> URL 입력
                  </button>
                  {(magForm.cover_images ?? []).filter(Boolean).length >= 2 && (
                    <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 700, background: '#DCFCE7', padding: '3px 10px', borderRadius: '999px' }}>자동 전환됨</span>
                  )}
                </div>
              </div>

              {/* 표지 이미지 (서가용) */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #F1F5F9' }}>
                <p style={sectionTitle}>표지 이미지 (서가 커버)</p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '72px', height: '96px', borderRadius: '8px', overflow: 'hidden', background: '#F1F5F9', flexShrink: 0, position: 'relative' }}>
                    {magForm.image_url ? <SafeImage src={magForm.image_url} alt="" fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={18} color="#CBD5E1" /></div>}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input value={magForm.image_url} onChange={e => setMagForm(p => ({ ...p, image_url: e.target.value }))} placeholder="이미지 URL" style={inputStyle} />
                    <button type="button" onClick={() => magCoverRef.current?.click()} disabled={uploadingMagCover} style={ghostBtn}>
                      {uploadingMagCover ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={11} />}
                      이미지 업로드
                    </button>
                  </div>
                </div>
              </div>

              {/* 액센트 컬러 + 배경색 */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #F1F5F9' }}>
                <p style={sectionTitle}>액센트 컬러</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <input type="color" value={magForm.accent_color} onChange={e => setMagForm(p => ({ ...p, accent_color: e.target.value }))} style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #F1F5F9', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                  <input value={magForm.accent_color} onChange={e => setMagForm(p => ({ ...p, accent_color: e.target.value }))} style={{ ...inputStyle, width: '130px', fontFamily: 'monospace' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {ACCENT_PRESETS.map(preset => (
                    <button key={preset.value} type="button" onClick={() => setMagForm(p => ({ ...p, accent_color: preset.value }))} title={preset.label}
                      style={{ width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', border: 'none', background: preset.value, outline: magForm.accent_color === preset.value ? `3px solid ${preset.value}` : 'none', outlineOffset: '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  ))}
                </div>
                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '3px', color: '#9B9590', textTransform: 'uppercase', margin: '0 0 6px' }}>
                  Seasonal (Bible §4)
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {SEASONAL_ACCENTS.map(preset => (
                    <button key={preset.value} type="button" onClick={() => setMagForm(p => ({ ...p, accent_color: preset.value }))} title={preset.label}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px 4px 4px', borderRadius: '999px', cursor: 'pointer', border: magForm.accent_color === preset.value ? `2px solid #8A6B4F` : '2px solid #F1F5F9', background: 'white', fontSize: '10px', fontWeight: 600, color: '#1A1A1A' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: preset.value, display: 'inline-block' }} />
                      {preset.label.replace(/\s*\(.+\)$/, '')}
                    </button>
                  ))}
                </div>
                <p style={sectionTitle}>배경색</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <input type="color" value={magForm.bg_color} onChange={e => setMagForm(p => ({ ...p, bg_color: e.target.value }))} style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #F1F5F9', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                  <input value={magForm.bg_color} onChange={e => setMagForm(p => ({ ...p, bg_color: e.target.value }))} style={{ ...inputStyle, width: '130px', fontFamily: 'monospace' }} />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['#F5F0EA', '#FFFFFF', '#1A1A1A', '#F0F4FF', '#FFF9F0', '#F0FAF4'].map(c => (
                      <button key={c} type="button" onClick={() => setMagForm(p => ({ ...p, bg_color: c }))} title={c}
                        style={{ width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', border: 'none', background: c, outline: magForm.bg_color === c ? `3px solid #4F46E5` : '2px solid #E2E8F0', outlineOffset: '1px' }} />
                    ))}
                  </div>
                </div>
                <p style={sectionTitle}>사진 필터</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COVER_FILTERS.map(f => (
                    <button key={f.key} type="button" onClick={() => setMagForm(p => ({ ...p, cover_filter: f.key }))}
                      style={{ padding: '6px 14px', borderRadius: '999px', cursor: 'pointer', transition: 'all 0.15s', border: magForm.cover_filter === f.key ? `2px solid ${magForm.accent_color}` : '2px solid #F1F5F9', background: magForm.cover_filter === f.key ? `${magForm.accent_color}15` : 'white', fontSize: '11px', fontWeight: 700, color: magForm.cover_filter === f.key ? magForm.accent_color : '#94A3B8' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 기여자 */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #F1F5F9' }}>
                <p style={sectionTitle}>기여자</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {Array.from(new Set([...DEFAULT_CONTRIBUTORS, ...magForm.contributors])).map(name => {
                    const checked = magForm.contributors.includes(name);
                    return (
                      <button key={name} type="button" onClick={() => setMagForm(p => ({ ...p, contributors: checked ? p.contributors.filter(c => c !== name) : [...p.contributors, name] }))}
                        style={{ padding: '6px 14px', borderRadius: '999px', cursor: 'pointer', border: checked ? '2px solid #4F46E5' : '2px solid #F1F5F9', background: checked ? '#EEF2FF' : 'white', fontSize: 12, fontWeight: 700, color: checked ? '#4F46E5' : '#94A3B8', transition: 'all 0.15s' }}>
                        {name}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={newContributor} onChange={e => setNewContributor(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = newContributor.trim(); if (v && !magForm.contributors.includes(v)) setMagForm(p => ({ ...p, contributors: [...p.contributors, v] })); setNewContributor(''); } }}
                    placeholder="새 기여자 이름 (Enter)" style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>

              {/* 통합 PDF */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <BookOpen size={16} color="#4F46E5" />
                  <p style={{ ...sectionTitle, margin: 0 }}>통합 PDF</p>
                  {hasPdf && <span style={{ background: '#DCFCE7', color: '#16A34A', borderRadius: '999px', padding: '2px 10px', fontSize: '10px', fontWeight: 900 }}>등록됨</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input value={magForm.pdf_url} onChange={e => setMagForm(p => ({ ...p, pdf_url: e.target.value }))} placeholder="PDF URL..." style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => magPdfRef.current?.click()} disabled={uploadingMagPdf} style={ghostBtn}>
                    {uploadingMagPdf ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={11} />}
                    업로드
                  </button>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={saveMagazine} disabled={savingMag}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '999px', padding: '14px 32px', fontSize: '12px', fontWeight: 900, letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase', opacity: savingMag ? 0.7 : 1 }}>
                  {savingMag ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                  {savingMag ? '저장 중...' : '표지 저장'}
                </button>
              </div>
            </div>

            {/* ─── 우: 스티키 프리뷰 ─── */}
            <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 100px)', minWidth: 0 }}>
              <div>
                <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '3px', color: '#CBD5E1', textTransform: 'uppercase', marginBottom: '8px' }}>Cover</p>
                <CoverPreview
                  title={magForm.title} year={magForm.year} month_name={magForm.month_name}
                  cover_copy={magForm.cover_copy}
                  contributors={magForm.contributors} image_url={magForm.image_url}
                  cover_images={magForm.cover_images} accent_color={magForm.accent_color}
                  bg_color={magForm.bg_color}
                  cover_filter={magForm.cover_filter} issue_number={magForm.issue_number}
                />
              </div>
              <div>
                <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '3px', color: '#CBD5E1', textTransform: 'uppercase', marginBottom: '8px' }}>Contents</p>
                <TocPreview
                  title={magForm.title} year={magForm.year} month_name={magForm.month_name}
                  articles={sortedArticles} accent_color={magForm.accent_color}
                  bg_color={magForm.bg_color}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          탭 2: 기사 편집
          ══════════════════════════════════════════ */}
      {tab === 'articles' && (
        <div className="article-edit-grid" style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: '45% 55%', gap: '24px', alignItems: 'start', minWidth: 0 }}>

          {/* ─── 좌: 기사 목록 + 인라인 폼 ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', minWidth: 0 }}>

            {/* 목록 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 900, color: '#94A3B8', margin: 0 }}>
                {sortedArticles.length}개 기사
              </p>
              <button onClick={openNewArticle} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '999px', padding: '8px 16px', fontSize: '11px', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer' }}>
                <Plus size={12} /> 기사 추가
              </button>
            </div>

            {/* 기사 카드 목록 */}
            {sortedArticles.length === 0 && !inlineIsNew && (
              <div style={{ textAlign: 'center', padding: '32px', color: '#CBD5E1', background: '#F8FAFC', borderRadius: '16px' }}>
                <FileText size={28} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '3px' }}>기사가 없습니다</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sortedArticles.map((article, idx) => {
                const isSelected = article.id === selectedArtId && !inlineIsNew;
                const typeCfg = TYPE_CONFIG[(article.article_type as ArticleType) ?? 'article'];
                const artStatus = ((article as Article & { article_status?: string }).article_status as ArticleStatus) ?? 'draft';
                const statusCfg = STATUS_CONFIG[artStatus];
                return (
                  <div key={article.id}>
                    <div onClick={() => selectArticle(article)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: isSelected ? '#F0F4FF' : '#F8FAFC', border: isSelected ? '1.5px solid #4F46E5' : '1px solid #F1F5F9', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#CBD5E1', width: '20px', textAlign: 'center', flexShrink: 0 }}>{idx + 1}</span>
                      <div style={{ width: '40px', height: '54px', borderRadius: '6px', overflow: 'hidden', background: '#E2E8F0', flexShrink: 0, position: 'relative' }}>
                        {article.image_url ? <SafeImage src={article.image_url} alt="" fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={14} color="#CBD5E1" /></div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <span style={{ background: typeCfg.bg, color: typeCfg.color, borderRadius: '3px', padding: '1px 6px', fontSize: '8px', fontWeight: 900, letterSpacing: '1px' }}>{typeCfg.label}</span>
                          <span style={{ background: statusCfg.bg, color: statusCfg.color, borderRadius: '3px', padding: '1px 6px', fontSize: '8px', fontWeight: 900 }}>{statusCfg.label}</span>
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title || '(제목 없음)'}</p>
                        <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>{article.author}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); moveArticle(article.id, 'up'); }} disabled={idx === 0 || reordering} style={{ padding: '3px', border: '1px solid #F1F5F9', borderRadius: '5px', background: 'white', cursor: 'pointer', color: '#94A3B8', display: 'flex', opacity: idx === 0 ? 0.3 : 1 }}><ChevronUp size={11} /></button>
                        <button onClick={e => { e.stopPropagation(); moveArticle(article.id, 'down'); }} disabled={idx === sortedArticles.length - 1 || reordering} style={{ padding: '3px', border: '1px solid #F1F5F9', borderRadius: '5px', background: 'white', cursor: 'pointer', color: '#94A3B8', display: 'flex', opacity: idx === sortedArticles.length - 1 ? 0.3 : 1 }}><ChevronDown size={11} /></button>
                      </div>
                    </div>

                    {/* ─── 인라인 편집 폼 (선택된 기사) ─── */}
                    {isSelected && inlineForm && (
                      <div onClick={() => setFocusedPageIdx(null)}>
                        <InlineForm
                          form={inlineForm} setForm={v => setInlineForm(p => p ? { ...p, ...v } : p)}
                          accentColor={accentCol} photoCount={photoCount}
                          saving={savingArticle} error={formError} isNew={false}
                          uploadingContent={uploadingContent}
                          uploadingSlotIdx={uploadingSlotIdx}
                          onSave={saveArticle}
                          onDelete={() => deleteArticle(article.id)}
                          onContentUpload={() => contentFileRef.current?.click()}
                          onContentDelete={deleteContentFile}
                          onSlotUpload={(idx) => { pendingSlot.current = idx; slotImgRef.current?.click(); }}
                        />
                      </div>
                    )}
                    {/* ─── 추가 페이지 섹션 (기본 접힘) ─── */}
                    {isSelected && !inlineIsNew && (
                      <div style={{ marginTop: '10px' }}>
                        <CollapsibleSection title={`추가 페이지 (${articlePages.length}장)`}>
                          <ArticlePagesSection
                            pages={articlePages}
                            setPages={setArticlePages}
                            saving={savingPages}
                            onSave={saveArticlePages}
                            uploadingSlot={uploadingPageSlot}
                            onImageUpload={(pi, si) => {
                              pendingPageSlot.current = { pageIdx: pi, slotIdx: si };
                              pageSlotRef.current?.click();
                            }}
                            accentColor={accentCol}
                            onFocusPage={setFocusedPageIdx}
                          />
                        </CollapsibleSection>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ─── 인라인 폼: 새 기사 ─── */}
              {inlineIsNew && inlineForm && (
                <div style={{ border: '1.5px dashed #4F46E5', borderRadius: '12px', overflow: 'hidden', marginTop: '4px' }} onClick={() => setFocusedPageIdx(null)}>
                  <div style={{ background: '#EEF2FF', padding: '8px 12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '2px', color: '#4F46E5', margin: 0 }}>+ 새 기사</p>
                  </div>
                  <InlineForm
                    form={inlineForm} setForm={v => setInlineForm(p => p ? { ...p, ...v } : p)}
                    accentColor={accentCol} photoCount={photoCount}
                    saving={savingArticle} error={formError} isNew={true}
                    uploadingContent={uploadingContent}
                    uploadingSlotIdx={uploadingSlotIdx}
                    onSave={saveArticle}
                    onDelete={() => { setInlineIsNew(false); setInlineForm(null); }}
                    onContentUpload={() => contentFileRef.current?.click()}
                    onContentDelete={deleteContentFile}
                    onSlotUpload={(idx) => { pendingSlot.current = idx; slotImgRef.current?.click(); }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ─── 우: 실시간 프리뷰 (스티키, 현재 포커스 페이지만) ─── */}
          <div className="article-preview-panel" style={{ position: 'sticky', top: '80px', minWidth: 0, width: '100%', maxWidth: 620, minHeight: 0, margin: '0 auto', alignSelf: 'start' }}>
            {inlineForm ? (() => {
              const totalPageCount = 1 + articlePages.length;
              const focusedExtraPage = focusedPageIdx !== null ? articlePages[focusedPageIdx] : null;
              const currentTemplateName = focusedPageIdx === null
                ? (TEMPLATE_META.find(t => t.key === inlineForm.template)?.label ?? 'Classic')
                : (TEMPLATE_META.find(t => t.key === focusedExtraPage?.template)?.label ?? 'Classic');
              const currentPageNum = focusedPageIdx === null ? 1 : focusedPageIdx + 2;

              return (
                <>
                  {/* 헤더: 인디케이터 + 다운로드 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '3px', color: '#CBD5E1', textTransform: 'uppercase', margin: 0 }}>
                      Page {currentPageNum}/{totalPageCount} · {currentTemplateName}
                    </p>
                    {focusedPageIdx === null && (
                      <DownloadBtn
                        targetRef={previewDivRef as React.RefObject<HTMLElement>}
                        filename={`TheMHJ_${magazine.month_name}${magazine.year}_${inlineForm.title.slice(0, 20)}`}
                        size="sm"
                      />
                    )}
                  </div>

                  {/* 현재 포커스 페이지 미리보기 (템플릿 기반) */}
                  {focusedPageIdx === null ? (
                    <div ref={previewDivRef} style={{ border: '1px solid #F1F5F9', borderRadius: '12px', overflow: 'hidden' }}>
                      <MagazinePage bgColor={bgCol}>
                        {renderTemplate(inlineForm.template, {
                          title: inlineForm.title,
                          author: inlineForm.author,
                          content: inlineForm.content,
                          article_images: (inlineForm.article_images ?? []).filter(Boolean),
                          image_positions: inlineForm.image_positions ?? [],
                          image_url: '',
                          template: inlineForm.template,
                          style_overrides: inlineForm.style_overrides ?? {},
                          kicker: inlineForm.kicker,
                          subtitle: inlineForm.subtitle,
                          sidebar_title: inlineForm.sidebar_title,
                          sidebar_body: inlineForm.sidebar_body,
                          directory_items: inlineForm.directory_items,
                          quote_text: inlineForm.quote_text,
                          quote_attribution: inlineForm.quote_attribution,
                        } as ArticlePreviewData, accentCol, bgCol)}
                      </MagazinePage>
                    </div>
                  ) : focusedExtraPage ? (
                    <div style={{ border: '1px solid #F1F5F9', borderRadius: '12px', overflow: 'hidden' }}>
                      <MagazinePage bgColor={bgCol}>
                        {renderTemplate(focusedExtraPage.template ?? inlineForm.template, {
                          title: inlineForm.title,
                          author: inlineForm.author,
                          content: focusedExtraPage.content,
                          article_images: (focusedExtraPage.images ?? []).filter(Boolean),
                          image_url: '',
                          template: focusedExtraPage.template ?? inlineForm.template,
                          style_overrides: inlineForm.style_overrides ?? {},
                        } as ArticlePreviewData, accentCol, bgCol, true)}
                      </MagazinePage>
                    </div>
                  ) : null}

                  {/* 페이지 전환 버튼 (추가 페이지 있을 때) */}
                  {!inlineIsNew && totalPageCount > 1 && (
                    <div style={{ display: 'flex', gap: '5px', marginTop: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setFocusedPageIdx(null)}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: focusedPageIdx === null ? `2px solid ${accentCol}` : '2px solid #F1F5F9', background: focusedPageIdx === null ? `${accentCol}15` : 'white', fontSize: '10px', fontWeight: 900, color: focusedPageIdx === null ? accentCol : '#94A3B8', cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        P1
                      </button>
                      {articlePages.map((_, pi) => (
                        <button
                          key={pi}
                          onClick={() => setFocusedPageIdx(pi)}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: focusedPageIdx === pi ? `2px solid ${accentCol}` : '2px solid #F1F5F9', background: focusedPageIdx === pi ? `${accentCol}15` : 'white', fontSize: '10px', fontWeight: 900, color: focusedPageIdx === pi ? accentCol : '#94A3B8', cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          P{pi + 2}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 액센트 색상 표시 */}
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: accentCol, display: 'inline-block' }} />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8' }}>Accent: {accentCol}</span>
                  </div>
                </>
              );
            })() : (
              <div style={{ aspectRatio: '210/297', background: '#F8FAFC', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, textAlign: 'center' }}>기사를 선택하면<br />미리보기가 표시됩니다</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          탭 3: 전체 미리보기
          ══════════════════════════════════════════ */}
      {tab === 'spread' && (() => {
        // 스프레드 페이지 목록 (모달용)
        const spreadPages: { label: string; content: React.ReactNode; artId?: number }[] = [
          {
            label: 'Cover',
            content: <CoverPreview
              title={magazine.title} year={magazine.year} month_name={magazine.month_name}
              cover_copy={magazine.cover_copy ?? ''}
              contributors={magazine.contributors ?? []} image_url={magazine.image_url}
              cover_images={magazine.cover_images ?? []}
              accent_color={magazine.accent_color ?? '#1A1A1A'}
              bg_color={magazine.bg_color ?? '#F5F0EA'}
              cover_filter={magazine.cover_filter ?? 'none'}
              issue_number={magazine.issue_number ?? ''}
            />,
          },
          {
            label: 'Contents',
            content: <TocPreview
              title={magazine.title} year={magazine.year} month_name={magazine.month_name}
              articles={sortedArticles} accent_color={magazine.accent_color ?? '#1A1A1A'}
              bg_color={magazine.bg_color ?? '#F5F0EA'}
            />,
          },
          ...sortedArticles.filter(a => a.article_type === 'article' || !a.article_type).map((article, idx) => {
            const tpl = (article as Article & { template?: string }).template ?? 'classic';
            const artData: ArticlePreviewData = {
              title: article.title, author: article.author,
              content: article.content, image_url: article.image_url,
              article_images: (article as Article & { article_images?: string[] }).article_images ?? [],
              image_positions: (article as Article & { image_positions?: string[] }).image_positions ?? [],
              template: tpl,
              style_overrides: (article.style_overrides as StyleOverrides | null) ?? {},
            };
            return {
              label: `P.${idx + 1} · ${article.author}`,
              artId: article.id,
              content: (
                <MagazinePage bgColor={bgCol}>
                  {renderTemplate(tpl, artData, accentCol, bgCol)}
                </MagazinePage>
              ),
            };
          }),
        ];

        return (
          <div style={{ padding: '0 24px' }}>
            {/* 스프레드 (줄바꿈 그리드) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', overflowY: 'auto' }}>
              {spreadPages.map((page, pi) => (
                <SpreadPage
                  key={pi}
                  label={page.label}
                  filename={`TheMHJ_${magazine.month_name}${magazine.year}_${page.label.replace(/[^a-zA-Z0-9]/g, '_')}`}
                  onEdit={page.artId !== undefined ? () => { setTab('articles'); selectArticle(articles.find(a => a.id === page.artId)!); } : page.label === 'Cover' ? () => setTab('cover') : undefined}
                  onPreview={() => setSpreadModal({ pages: spreadPages, idx: pi })}
                >
                  {page.content}
                </SpreadPage>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ─── 스프레드 풀스크린 모달 ─── */}
      {spreadModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9000, display: 'flex', flexDirection: 'column' }}
          onClick={() => setSpreadModal(null)}
        >
          <style>{`@keyframes fadeInScale { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }`}</style>

          {/* ── 상단 고정 바: 레이블 + 줌 컨트롤 + 닫기 ── */}
          <div
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', gap: '16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 레이블 */}
            <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '3px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', minWidth: '80px' }}>
              {spreadModal.pages[spreadModal.idx].label}
            </span>
            {/* 줌 컨트롤 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
              <button onClick={() => setModalZoom(p => Math.max(40, p - 10))} style={{ ...zoomBtn, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}><ZoomOut size={13} /></button>
              <input type="range" min={40} max={250} value={modalZoom} onChange={e => setModalZoom(Number(e.target.value))} style={{ width: '100px', accentColor: '#4F46E5', cursor: 'pointer' }} />
              <button onClick={() => setModalZoom(p => Math.min(250, p + 10))} style={{ ...zoomBtn, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}><ZoomIn size={13} /></button>
              <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', minWidth: '36px' }}>{modalZoom}%</span>
              {[50, 75, 100, 150, 200, 250].map(v => (
                <button key={v} onClick={() => setModalZoom(v)} style={{ padding: '3px 8px', borderRadius: '6px', border: 'none', background: modalZoom === v ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>{v}%</button>
              ))}
            </div>
            {/* 페이지 카운터 + 닫기 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '80px', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{spreadModal.idx + 1} / {spreadModal.pages.length}</span>
              <button onClick={() => setSpreadModal(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>ESC</button>
            </div>
          </div>

          {/* ── 가운데 스크롤 영역: 페이지 콘텐츠 ── */}
          <div
            style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ animation: 'fadeInScale 0.2s ease', transform: `scale(${modalZoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease', flexShrink: 0 }}>
              {spreadModal.pages[spreadModal.idx].content}
            </div>
          </div>

          {/* ── 하단 고정 바: 이전/다음 ── */}
          <div
            style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', gap: '16px', padding: '14px 24px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { setSpreadModal(p => p && p.idx > 0 ? { ...p, idx: p.idx - 1 } : p); setModalZoom(100); }}
              disabled={spreadModal.idx === 0}
              style={{ padding: '8px 20px', background: spreadModal.idx === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '999px', color: 'white', cursor: spreadModal.idx === 0 ? 'default' : 'pointer', fontSize: '12px', fontWeight: 700, opacity: spreadModal.idx === 0 ? 0.3 : 1 }}>
              ← 이전
            </button>
            <button
              onClick={() => { setSpreadModal(p => p && p.idx < p.pages.length - 1 ? { ...p, idx: p.idx + 1 } : p); setModalZoom(100); }}
              disabled={spreadModal.idx === spreadModal.pages.length - 1}
              style={{ padding: '8px 20px', background: spreadModal.idx === spreadModal.pages.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '999px', color: 'white', cursor: spreadModal.idx === spreadModal.pages.length - 1 ? 'default' : 'pointer', fontSize: '12px', fontWeight: 700, opacity: spreadModal.idx === spreadModal.pages.length - 1 ? 0.3 : 1 }}>
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* ─── Hidden file inputs ─── */}
      <input ref={magPdfRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadMagPdf(f); e.target.value = ''; }} />
      <input ref={magCoverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setCropCoverFile(f); e.target.value = ''; }} />
      <input ref={extraImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadExtraCoverImage(f); e.target.value = ''; }} />
      <input ref={contentFileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadContentFile(f); e.target.value = ''; }} />
      <input ref={slotImgRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) setCropSlotFile({ file: f, slotIdx: pendingSlot.current }); e.target.value = ''; }} />
      <input ref={pageSlotRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) setCropPageSlotFile({ file: f, pageIdx: pendingPageSlot.current.pageIdx, slotIdx: pendingPageSlot.current.slotIdx }); e.target.value = ''; }} />

      {/* ─── 토스트 ─── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', background: '#1A1A1A', color: 'white', borderRadius: '999px', padding: '12px 24px', fontSize: '13px', fontWeight: 700, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 9999, whiteSpace: 'nowrap' }}>
          <Check size={14} style={{ display: 'inline', marginRight: 8, color: '#4ADE80' }} />
          {toast}
        </div>
      )}

      {cropCoverFile && (
        <ImageCropModal
          imageFile={cropCoverFile}
          defaultAspect={3 / 4}
          onCropComplete={(blob, name) => { setCropCoverFile(null); uploadMagCover(blob, name); }}
          onSkip={(file) => { setCropCoverFile(null); uploadMagCover(file); }}
          onCancel={() => setCropCoverFile(null)}
        />
      )}

      {cropSlotFile && (
        <ImageCropModal
          imageFile={cropSlotFile.file}
          defaultAspect={16 / 10}
          onCropComplete={(blob, name) => {
            const slotIdx = cropSlotFile.slotIdx;
            setCropSlotFile(null);
            uploadArticleSlotImage(blob, slotIdx, name);
          }}
          onSkip={(file) => {
            const slotIdx = cropSlotFile.slotIdx;
            setCropSlotFile(null);
            uploadArticleSlotImage(file, slotIdx);
          }}
          onCancel={() => setCropSlotFile(null)}
        />
      )}

      {cropPageSlotFile && (
        <ImageCropModal
          imageFile={cropPageSlotFile.file}
          defaultAspect={16 / 10}
          onCropComplete={(blob, name) => {
            const { pageIdx, slotIdx } = cropPageSlotFile;
            setCropPageSlotFile(null);
            uploadPageSlotImage(blob, pageIdx, slotIdx, name);
          }}
          onSkip={(file) => {
            const { pageIdx, slotIdx } = cropPageSlotFile;
            setCropPageSlotFile(null);
            uploadPageSlotImage(file, pageIdx, slotIdx);
          }}
          onCancel={() => setCropPageSlotFile(null)}
        />
      )}
    </div>
  );
}

/* ─── 스타일 헬퍼 ─── */
const sectionTitle: React.CSSProperties = {
  fontSize: '10px', fontWeight: 900, letterSpacing: '3px',
  color: '#94A3B8', textTransform: 'uppercase', marginBottom: '14px', marginTop: 0,
};
const ghostBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', background: '#F8FAFC', border: '1px dashed #CBD5E1',
  borderRadius: '10px', fontSize: '11px', fontWeight: 700, color: '#64748B', cursor: 'pointer',
};
const zoomBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '6px', background: 'white', border: '1px solid #F1F5F9',
  borderRadius: '8px', cursor: 'pointer', color: '#64748B',
};

/* ─── SpreadPage: 스프레드 뷰 아이템 ─── */
const SPREAD_SCALE = 0.7;
const SPREAD_PAGE_W = 420;
const SPREAD_PAGE_H = 594;
const SPREAD_SCALED_W = Math.round(SPREAD_PAGE_W * SPREAD_SCALE);  // 294
const SPREAD_SCALED_H = Math.round(SPREAD_PAGE_H * SPREAD_SCALE);  // 416

function SpreadPage({ label, children, filename, onEdit, onPreview }: {
  label: string;
  children: React.ReactNode;
  filename: string;
  pageWidth?: number; // kept for compat but unused in spread view
  onEdit?: () => void;
  onPreview: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  return (
    <div style={{ width: `${SPREAD_SCALED_W}px`, flexShrink: 0 }}>
      {/* 라벨 + 버튼 행 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
        <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '2px', color: '#CBD5E1', textTransform: 'uppercase', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {label}
        </p>
        <button onClick={onPreview} title="미리보기" style={{ padding: '3px 7px', background: 'white', border: '1px solid #F1F5F9', borderRadius: '6px', cursor: 'pointer', fontSize: '9px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>🔍</button>
        {onEdit && <button onClick={onEdit} title="편집" style={{ padding: '3px 7px', background: 'white', border: '1px solid #F1F5F9', borderRadius: '6px', cursor: 'pointer', fontSize: '9px', fontWeight: 700, color: '#4F46E5', whiteSpace: 'nowrap' }}>✏️</button>}
        <DownloadBtn targetRef={wrapRef as React.RefObject<HTMLElement>} filename={filename} size="sm" />
      </div>
      {/* 스케일 클립 박스: 시각적으로 축소 표시, wrapRef는 원본 크기에 연결 */}
      <div style={{ width: `${SPREAD_SCALED_W}px`, height: `${SPREAD_SCALED_H}px`, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ transform: `scale(${SPREAD_SCALE})`, transformOrigin: 'top left', width: `${SPREAD_PAGE_W}px` }}>
          <div ref={wrapRef}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── 템플릿 레이아웃 다이어그램 ─── */
function TemplateDiagram({ tplKey }: { tplKey: string }) {
  const photo = (label: string, radius = '2px') => (
    <div style={{ background: '#374151', borderRadius: radius, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', width: '100%', height: '100%' }}>
      <ImageIcon size={10} color="rgba(255,255,255,0.75)" strokeWidth={2} />
      <span style={{ fontSize: '7px', fontWeight: 900, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>{label}</span>
    </div>
  );
  const line = (w: string, h = '2px', bg = '#E5E7EB') => (
    <div style={{ height: h, background: bg, borderRadius: '1px', width: w, flexShrink: 0 }} />
  );
  const style: React.CSSProperties = { display: 'flex', height: '100%', padding: '5px', boxSizing: 'border-box' };

  if (tplKey === 'photo-hero') return (
    <div style={{ ...style, flexDirection: 'column', gap: '4px' }}>
      <div style={{ flex: 3, width: '100%' }}>{photo('A', '3px')}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
        {line('75%', '3px', '#D1D5DB')}{line('90%')}{line('65%')}
      </div>
    </div>
  );
  if (tplKey === 'classic') return (
    <div style={{ ...style, flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {line('70%', '3px', '#D1D5DB')}{line('90%')}{line('55%')}
      </div>
      <div style={{ flex: 1, width: '100%' }}>{photo('A', '3px')}</div>
    </div>
  );
  if (tplKey === 'photo-essay') return (
    <div style={{ ...style, flexDirection: 'column', gap: '4px' }}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '3px' }}>
        {['A','B','C','D'].map(l => <div key={l} style={{ minHeight: 0 }}>{photo(l)}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {line('80%')}{line('60%')}
      </div>
    </div>
  );
  if (tplKey === 'story-2') return (
    <div style={{ ...style, flexDirection: 'row', gap: '5px' }}>
      <div style={{ width: '25%' }}>{photo('A', '3px')}</div>
      <div style={{ width: '25%' }}>{photo('B', '3px')}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
        {line('90%', '3px', '#D1D5DB')}{line('80%')}{line('85%')}{line('70%')}
      </div>
    </div>
  );
  if (tplKey === 'text-only') return (
    <div style={{ ...style, flexDirection: 'column', gap: '3px', justifyContent: 'center' }}>
      {line('45%', '2px', '#9CA3AF')}
      {line('85%', '3px', '#D1D5DB')}
      {line('90%')}{line('80%')}{line('90%')}{line('75%')}{line('85%')}
    </div>
  );
  if (tplKey === 'cover') return (
    <div style={{ ...style, padding: 0, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#374151', borderRadius: '2px' }} />
      <div style={{ position: 'absolute', top: '6px', left: '7px', fontSize: '9px', fontWeight: 900, color: 'white', letterSpacing: '1px' }}>MHJ</div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 55%)', borderRadius: '2px' }} />
      <div style={{ position: 'absolute', left: '7px', right: '7px', bottom: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {line('70%', '4px', 'rgba(255,255,255,0.9)')}
        {line('50%', '2px', 'rgba(255,255,255,0.6)')}
      </div>
    </div>
  );
  if (tplKey === 'title-card') return (
    <div style={{ ...style, flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
      {line('30%', '2px', '#D1D5DB')}
      <div style={{ height: '3px' }} />
      {line('60%', '4px', '#374151')}
      {line('70%', '4px', '#374151')}
      <div style={{ height: '2px' }} />
      {line('55%', '2px', '#D1D5DB')}
      <div style={{ width: '12px', height: '1px', background: '#9CA3AF', margin: '3px 0' }} />
      {line('25%', '2px', '#D1D5DB')}
    </div>
  );
  if (tplKey === 'sidebar') return (
    <div style={{ ...style, flexDirection: 'row', gap: '4px' }}>
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
        {line('80%', '3px', '#D1D5DB')}
        {line('95%')}{line('85%')}{line('90%')}{line('70%')}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center', background: '#F3F1EC', borderLeft: '2px solid #9CA3AF', padding: '3px' }}>
        {line('70%', '2px', '#9CA3AF')}
        {line('90%')}{line('75%')}{line('85%')}
      </div>
    </div>
  );
  if (tplKey === 'directory') return (
    <div style={{ ...style, flexDirection: 'column', gap: '4px' }}>
      {line('40%', '3px', '#374151')}
      {line('25%', '1px', '#9CA3AF')}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <div style={{ fontSize: '8px', color: '#9CA3AF', fontStyle: 'italic', fontWeight: 900 }}>0{i+1}</div>
            {line('90%', '2px', '#374151')}
            {line('70%', '1px', '#D1D5DB')}
          </div>
        ))}
      </div>
    </div>
  );
  if (tplKey === 'pull-quote') return (
    <div style={{ ...style, flexDirection: 'column', gap: '3px', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <span style={{ position: 'absolute', top: '4px', left: '10px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '28px', color: '#9CA3AF', opacity: 0.4, lineHeight: 1 }}>“</span>
      {line('70%', '4px', '#374151')}
      {line('85%', '4px', '#374151')}
      {line('55%', '4px', '#374151')}
      <div style={{ height: '4px' }} />
      {line('25%', '2px', '#9CA3AF')}
    </div>
  );
  if (tplKey === 'mums-note') return (
    <div style={{ ...style, flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
      {/* 타이틀 + 구분선 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', alignItems: 'center' }}>
        {line('55%', '3px', '#374151')}
        {line('100%', '1px', '#E5E7EB')}
      </div>
      {/* 오너먼트 원 */}
      <div style={{ width: '22%', aspectRatio: '1 / 1', borderRadius: '50%', border: '1px solid #9CA3AF', margin: '1px 0' }} />
      {/* 본문 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', alignItems: 'center' }}>
        {line('90%')}{line('85%')}{line('92%')}{line('65%')}
      </div>
      {/* 하단 구분선 */}
      {line('100%', '1px', '#E5E7EB')}
    </div>
  );
  if (tplKey === 'little-notes' || tplKey === 'little-note') return (
    <div style={{ ...style, flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
      {/* 타이틀 + 구분선 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', alignItems: 'center' }}>
        {line('55%', '3px', '#374151')}
        {line('100%', '1px', '#E5E7EB')}
      </div>
      {/* 이미지 */}
      <div style={{ width: '38%', aspectRatio: '4 / 5' }}>{photo('A', '2px')}</div>
      {/* 따옴표 + 인용 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', alignItems: 'center', position: 'relative' }}>
        <span style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '14px', color: '#9CA3AF', opacity: 0.5, lineHeight: 0.5 }}>“</span>
        {line('75%', '2px', '#374151')}
        {line('55%', '2px', '#374151')}
      </div>
      {/* 하단 구분선 */}
      {line('100%', '1px', '#E5E7EB')}
    </div>
  );
  if (tplKey === 'middle') return (
    <div style={{ ...style, flexDirection: 'column', gap: '4px' }}>
      <div style={{ flex: 1.2, width: '100%' }}>{photo('A', '2px')}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
        {line('70%', '3px', '#D1D5DB')}{line('90%')}{line('80%')}{line('85%')}
      </div>
    </div>
  );
  if (tplKey === 'feature-half') return (
    <div style={{ ...style, flexDirection: 'column', gap: '4px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
        {line('70%', '3px', '#D1D5DB')}{line('90%')}{line('80%')}{line('85%')}
      </div>
      <div style={{ flex: 1.2, width: '100%' }}>{photo('A', '2px')}</div>
    </div>
  );
  if (tplKey === 'left') return (
    <div style={{ ...style, flexDirection: 'row', gap: '4px' }}>
      <div style={{ width: '42%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ flex: 1 }}>{photo('A', '2px')}</div>
        <div style={{ flex: 1 }}>{photo('B', '2px')}</div>
        <div style={{ flex: 1 }}>{photo('C', '2px')}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
        {line('90%', '3px', '#D1D5DB')}{line('85%')}{line('90%')}{line('70%')}
      </div>
    </div>
  );
  if (tplKey === 'right') return (
    <div style={{ ...style, flexDirection: 'row', gap: '4px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
        {line('90%', '3px', '#D1D5DB')}{line('85%')}{line('90%')}{line('70%')}
      </div>
      <div style={{ width: '42%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ flex: 1 }}>{photo('A', '2px')}</div>
        <div style={{ flex: 1 }}>{photo('B', '2px')}</div>
        <div style={{ flex: 1 }}>{photo('C', '2px')}</div>
      </div>
    </div>
  );
  if (tplKey === 'special') return (
    <div style={{ ...style, padding: '3px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '2px', width: '100%', height: '100%' }}>
        {['A','B','C','D','E','F','G','H','I'].map(l => (
          <div key={l} style={{ minHeight: 0 }}>{photo(l, '1px')}</div>
        ))}
      </div>
    </div>
  );
  if (tplKey === 'free') return (
    <div style={{ ...style, flexDirection: 'column', gap: '3px', justifyContent: 'center' }}>
      {line('45%', '2px', '#9CA3AF')}
      {line('85%', '3px', '#D1D5DB')}
      {line('90%')}{line('80%')}{line('90%')}{line('75%')}{line('85%')}
    </div>
  );
  /* split */
  return (
    <div style={{ ...style, flexDirection: 'row', gap: '5px' }}>
      <div style={{ width: '45%' }}>{photo('A', '3px')}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
        {line('90%', '3px', '#D1D5DB')}{line('80%')}{line('85%')}{line('70%')}
      </div>
    </div>
  );
}

/* ─── 디렉토리 항목 편집기 (2D) ─── */
function DirectoryItemsEditor({
  items, onChange, accentColor = '#8A6B4F',
}: {
  items: DirectoryItem[];
  onChange: (next: DirectoryItem[]) => void;
  accentColor?: string;
}) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const patch = (idx: number, delta: Partial<DirectoryItem>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...delta } : it)));
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const move = (idx: number, dir: 'up' | 'down') => {
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= items.length) return;
    const next = [...items];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };
  const add = () => onChange([...items, { number: pad(items.length + 1), title: '' }]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.length === 0 && (
        <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', padding: '14px 8px', margin: 0, fontStyle: 'italic' }}>
          목차 항목이 없습니다. 아래 버튼으로 추가하세요.
        </p>
      )}
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            border: '1px solid #F1F5F9',
            borderRadius: '10px',
            padding: '10px',
            background: '#FAFAF9',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              value={item.number ?? ''}
              onChange={e => patch(i, { number: e.target.value })}
              placeholder={pad(i + 1)}
              style={{ ...inputStyle, width: '60px', textAlign: 'center', padding: '7px 8px', fontSize: '12px' }}
              aria-label="항목 번호"
            />
            <input
              type="number"
              value={item.page ?? ''}
              onChange={e => patch(i, { page: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="p."
              style={{ ...inputStyle, width: '70px', textAlign: 'center', padding: '7px 8px', fontSize: '12px' }}
              aria-label="페이지 번호"
            />
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => move(i, 'up')}
              disabled={i === 0}
              style={{ padding: '5px', background: 'white', border: '1px solid #F1F5F9', borderRadius: '6px', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, display: 'flex', color: '#64748B' }}
              aria-label="위로 이동"
            >
              <ChevronUp size={12} />
            </button>
            <button
              type="button"
              onClick={() => move(i, 'down')}
              disabled={i === items.length - 1}
              style={{ padding: '5px', background: 'white', border: '1px solid #F1F5F9', borderRadius: '6px', cursor: i === items.length - 1 ? 'default' : 'pointer', opacity: i === items.length - 1 ? 0.3 : 1, display: 'flex', color: '#64748B' }}
              aria-label="아래로 이동"
            >
              <ChevronDown size={12} />
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ padding: '5px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '6px', cursor: 'pointer', color: '#EF4444', display: 'flex' }}
              aria-label="항목 삭제"
            >
              <X size={12} />
            </button>
          </div>
          <input
            value={item.title}
            onChange={e => patch(i, { title: e.target.value })}
            placeholder="항목 제목"
            style={inputStyle}
          />
          <textarea
            value={item.description ?? ''}
            onChange={e => patch(i, { description: e.target.value })}
            placeholder="설명 (선택)"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{
          padding: '10px',
          background: 'white',
          border: `1.5px dashed ${accentColor}`,
          borderRadius: '10px',
          color: accentColor,
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        + 항목 추가
      </button>
    </div>
  );
}

/* ─── 접이식 섹션 헬퍼 ─── */
function CollapsibleSection({
  title, defaultOpen = false, children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #F1F5F9', borderRadius: '10px', background: 'white', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: '10px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase',
          color: '#1A1A1A',
        }}
      >
        <span>{title}</span>
        {open ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
      </button>
      {open && <div style={{ padding: '4px 14px 14px', borderTop: '1px solid #F8FAFC' }}>{children}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════
   인라인 편집 폼 컴포넌트
   ════════════════════════════════════════════ */
function InlineForm({
  form, setForm, accentColor, photoCount,
  saving, error, isNew,
  uploadingContent, uploadingSlotIdx,
  onSave, onDelete, onContentUpload, onContentDelete, onSlotUpload,
}: {
  form: ArticleInput;
  setForm: (patch: Partial<ArticleInput>) => void;
  accentColor: string;
  photoCount: number;
  saving: boolean;
  error: string;
  isNew: boolean;
  uploadingContent: boolean;
  uploadingSlotIdx: number | null;
  onSave: () => void;
  onDelete: () => void;
  onContentUpload: () => void;
  onContentDelete: () => void;
  onSlotUpload: (idx: number) => void;
}) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #F1F5F9', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* 상태 */}
      <div>
        <label style={labelStyle}>상태</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(Object.entries(STATUS_CONFIG) as [ArticleStatus, typeof STATUS_CONFIG[ArticleStatus]][]).map(([key, cfg]) => (
            <button key={key} type="button" onClick={() => setForm({ article_status: key })}
              style={{ flex: 1, padding: '7px 4px', borderRadius: '10px', cursor: 'pointer', fontSize: '10px', fontWeight: 900, transition: 'all 0.15s', border: form.article_status === key ? `2px solid ${cfg.color}` : '2px solid #F1F5F9', background: form.article_status === key ? cfg.bg : 'white', color: form.article_status === key ? cfg.color : '#CBD5E1' }}>
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* 템플릿 선택 (기본 열림) — 카테고리 구조 */}
      <CollapsibleSection title="템플릿" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Legacy 안내 배너 */}
          {LEGACY_TEMPLATES.includes(form.template) && (
            <div style={{ padding: '8px 12px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '11px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={12} />
              <span>현재 template: <strong>{form.template}</strong> (legacy). 아래 신규 카테고리에서 재선택 권장.</span>
            </div>
          )}

          {TEMPLATE_CATEGORIES.map(cat => (
            <div key={cat.key}>
              <p style={{
                fontSize: '9px', fontWeight: 900, letterSpacing: '3px',
                color: '#94A3B8', textTransform: 'uppercase',
                margin: '0 0 8px', paddingLeft: '2px',
              }}>
                {cat.label}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {cat.templates.map(t => {
                  const selected = form.template === t.key;
                  const handleSelect = () => {
                    const patch: Partial<ArticleInput> = { template: t.key };
                    if (t.key === 'mums-note') patch.title = "Mum's Note";
                    else if (t.key === 'little-notes') patch.title = 'Little Notes';
                    setForm(patch);
                  };
                  return (
                    <button key={t.key} type="button" onClick={handleSelect}
                      style={{ padding: 0, borderRadius: '10px', cursor: 'pointer', overflow: 'hidden', border: selected ? `2px solid ${accentColor}` : '2px solid #F1F5F9', background: selected ? `${accentColor}10` : 'white', transition: 'background 0.15s, border-color 0.15s' }}>
                      <div style={{ aspectRatio: '42 / 55', overflow: 'hidden', background: selected ? 'white' : '#F8FAFC' }}>
                        <TemplateDiagram tplKey={t.key} />
                      </div>
                      <div style={{ padding: '6px 6px 7px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <p style={{ fontSize: '9px', fontWeight: 900, color: selected ? accentColor : '#1A1A1A', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{t.label}</p>
                        <p style={{ fontSize: '8px', color: '#94A3B8', margin: 0, lineHeight: 1.3 }}>{t.desc}</p>
                        <p style={{ fontSize: '7px', fontWeight: 700, color: '#CBD5E1', margin: 0, letterSpacing: '1px' }}>사진 {t.photos}장</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 2D: 템플릿별 전용 필드 */}
      {(form.template === 'title-card' || form.template === 'photo-hero') && (
        <CollapsibleSection title="타이틀 · 소제목" defaultOpen>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Kicker (카테고리 라벨)</label>
              <input
                value={form.kicker}
                onChange={e => setForm({ kicker: e.target.value })}
                placeholder={form.template === 'photo-hero' ? 'Feature / Essay / Story' : 'Title Card'}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Subtitle (standfirst)</label>
              <textarea
                value={form.subtitle}
                onChange={e => setForm({ subtitle: e.target.value })}
                placeholder="기사 소제목 또는 스탠드퍼스트 (최대 220자 권장)"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', marginBottom: 0 }}>
                비우면 본문 첫 단락이 자동으로 사용됩니다.
              </p>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {form.template === 'sidebar' && (
        <CollapsibleSection title="사이드바 콘텐츠" defaultOpen>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Sidebar Title</label>
              <input
                value={form.sidebar_title}
                onChange={e => setForm({ sidebar_title: e.target.value })}
                placeholder="Notes / References / Tips"
                style={inputStyle}
              />
              <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', marginBottom: 0 }}>
                비우면 &quot;Notes&quot;가 기본 표시됩니다.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Sidebar Body (HTML 가능)</label>
              <textarea
                value={form.sidebar_body}
                onChange={e => setForm({ sidebar_body: e.target.value })}
                placeholder="&lt;ul&gt;&lt;li&gt;항목 1&lt;/li&gt;&lt;/ul&gt;"
                rows={5}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
              />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {form.template === 'directory' && (
        <CollapsibleSection title={`목차 항목 (${form.directory_items.length})`} defaultOpen>
          <DirectoryItemsEditor
            items={form.directory_items}
            onChange={(next) => setForm({ directory_items: next })}
            accentColor={accentColor}
          />
        </CollapsibleSection>
      )}

      {form.template === 'pull-quote' && (
        <CollapsibleSection title="인용구" defaultOpen>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Quote Text</label>
              <textarea
                value={form.quote_text}
                onChange={e => setForm({ quote_text: e.target.value })}
                placeholder="인용할 문장을 입력하세요."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Attribution</label>
              <input
                value={form.quote_attribution}
                onChange={e => setForm({ quote_attribution: e.target.value })}
                placeholder="— Yussi"
                style={inputStyle}
              />
              <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', marginBottom: 0 }}>
                비우면 저자(author) 값이 기본 표시됩니다.
              </p>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Little Notes 전용 — 인용구 + 서명 (content 대신) */}
      {(form.template === 'little-notes' || form.template === 'little-note') && (
        <CollapsibleSection title="인용구 · 서명" defaultOpen>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Quote</label>
              <textarea
                value={form.quote_text}
                onChange={e => setForm({ quote_text: e.target.value })}
                placeholder="아이의 말 / 짧은 닫는 인용구"
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Signature</label>
              <input
                value={form.quote_attribution}
                onChange={e => setForm({ quote_attribution: e.target.value })}
                placeholder="예: Min (7세)"
                style={inputStyle}
              />
              <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', marginBottom: 0 }}>
                앞에 em-dash(—)가 자동으로 붙습니다. 비우면 저자(author)가 사용됩니다.
              </p>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* 제목 — mums-note / little-notes는 고정 타이틀 */}
      {(form.template === 'mums-note' || form.template === 'little-notes' || form.template === 'little-note') ? (
        <div>
          <label style={labelStyle}>타이틀 (고정)</label>
          <div style={{
            ...inputStyle,
            background: '#F8FAFC',
            color: '#64748B',
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'not-allowed',
          }}>
            <AlertCircle size={12} style={{ color: '#CBD5E1' }} />
            {form.template === 'mums-note' ? "Mum's Note" : 'Little Notes'}
            <span style={{ marginLeft: 'auto', fontFamily: 'inherit', fontSize: '10px', fontWeight: 400, color: '#CBD5E1', fontStyle: 'normal' }}>
              변경 불가
            </span>
          </div>
        </div>
      ) : (
        <div>
          <label style={labelStyle}>제목 *</label>
          <input value={form.title} onChange={e => setForm({ title: e.target.value })} placeholder="기사 제목" style={inputStyle} />
        </div>
      )}

      {/* 저자 + 날짜 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={labelStyle}>저자 (복수 선택 가능)</label>
          {/* 체크박스 다중 선택 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
            {['PeNnY', 'Yussi', 'Min', 'Hyun', 'Jin'].map(name => {
              const selected = form.author.split(',').map(s => s.trim()).filter(Boolean).includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    const current = form.author.split(',').map(s => s.trim()).filter(Boolean);
                    const next = selected ? current.filter(n => n !== name) : [...current, name];
                    setForm({ author: next.join(', ') });
                  }}
                  style={{
                    padding: '5px 11px', borderRadius: '999px', cursor: 'pointer',
                    fontSize: '11px', fontWeight: 700,
                    border: selected ? '1.5px solid #4F46E5' : '1.5px solid #F1F5F9',
                    background: selected ? '#EEF2FF' : '#F8FAFC',
                    color: selected ? '#4F46E5' : '#94A3B8',
                    transition: 'all 0.15s',
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
          {/* 기타 직접 입력 */}
          <input
            placeholder="기타 이름 입력 후 Enter"
            style={{ ...inputStyle, fontSize: '12px', padding: '8px 12px' }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const val = (e.currentTarget as HTMLInputElement).value.trim();
                if (!val) return;
                const current = form.author.split(',').map(s => s.trim()).filter(Boolean);
                if (!current.includes(val)) setForm({ author: [...current, val].join(', ') });
                (e.currentTarget as HTMLInputElement).value = '';
              }
            }}
          />
          {form.author && (
            <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', marginBottom: 0 }}>
              선택됨: <strong style={{ color: '#4F46E5' }}>{form.author}</strong>
            </p>
          )}
        </div>
        <div>
          <label style={labelStyle}>날짜</label>
          <input value={form.date} onChange={e => setForm({ date: e.target.value })} style={inputStyle} />
        </div>
      </div>

      {/* 기사 사진 슬롯 (기본 열림) */}
      {photoCount > 0 && (
        <CollapsibleSection
          title={`기사 사진 (${(form.article_images ?? []).filter(Boolean).length}/${photoCount})`}
          defaultOpen
        >
          <div style={{ display: 'grid', gridTemplateColumns: photoCount === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '8px' }}>
            {Array.from({ length: photoCount }, (_, i) => {
              const src = form.article_images?.[i] ?? '';
              const pos = form.image_positions?.[i] ?? 'center';
              const isUp = uploadingSlotIdx === i;
              const POS_LABELS: Record<string, string> = { 'top left': '좌상', 'top': '상', 'top right': '우상', 'left': '좌', 'center': '중', 'right': '우', 'bottom left': '좌하', 'bottom': '하', 'bottom right': '우하' };
              const POS_GRID = ['top left','top','top right','left','center','right','bottom left','bottom','bottom right'];
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div onClick={() => !isUp && onSlotUpload(i)} style={{ border: '2px dashed #F1F5F9', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', background: '#F8FAFC', aspectRatio: '4/3', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {src
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos }} />
                      : <div style={{ color: '#CBD5E1', textAlign: 'center' }}>{isUp ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={14} />}<p style={{ fontSize: '9px', fontWeight: 700, margin: '3px 0 0' }}>사진 {i + 1}</p></div>
                    }
                    {src && (
                      <button type="button" onClick={e => { e.stopPropagation(); const imgs = [...(form.article_images ?? [])]; imgs[i] = ''; setForm({ article_images: imgs }); }}
                        style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  {/* 포지션 3×3 그리드 */}
                  {src && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                      {POS_GRID.map(p => (
                        <button key={p} type="button" onClick={() => { const positions = [...(form.image_positions ?? [])]; positions[i] = p; setForm({ image_positions: positions }); }}
                          style={{ padding: '3px 2px', border: pos === p ? '1.5px solid #4F46E5' : '1px solid #F1F5F9', borderRadius: '4px', background: pos === p ? '#EEF2FF' : 'white', cursor: 'pointer', fontSize: '8px', fontWeight: 700, color: pos === p ? '#4F46E5' : '#CBD5E1', lineHeight: 1 }}>
                          {POS_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* 본문 TipTap — little-notes는 인용구로 대체되므로 숨김 */}
      {form.template !== 'little-notes' && form.template !== 'little-note' && (
        <CollapsibleSection title="텍스트 본문" defaultOpen={form.template === 'mums-note'}>
          <Suspense fallback={<div style={{ ...inputStyle, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /></div>}>
            <TipTapEditor content={form.content} onChange={html => setForm({ content: html })} placeholder={form.template === 'mums-note' ? "Yussi의 여는 에세이 — 첫 글자는 자동 드롭캡." : "기사 텍스트..."} />
          </Suspense>
        </CollapsibleSection>
      )}

      {/* 콘텐츠 파일 (기본 접힘) */}
      <CollapsibleSection title="콘텐츠 파일 (이미지 / PDF)">
        <div onClick={onContentUpload} style={{ border: '2px dashed #F1F5F9', borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
          {form.pdf_url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}>
              <FileText size={20} color="#4F46E5" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#1A1A1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {form.pdf_url.split('/').pop()?.slice(0, 30)}
              </p>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onContentDelete(); }}
                style={{ flexShrink: 0, background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '6px', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="파일 삭제"
              >
                <X size={12} color="#EF4444" />
              </button>
            </div>
          ) : (
            <div style={{ color: '#CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '6px 0' }}>
              {uploadingContent ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={16} />}
              <p style={{ fontSize: '10px', fontWeight: 700, margin: 0 }}>{uploadingContent ? '업로드 중...' : '파일 업로드'}</p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* 스타일 조정 패널 (접이식) */}
      <StyleOverridePanel
        value={form.style_overrides ?? {}}
        onChange={(so) => setForm({ style_overrides: so })}
        accentColor={accentColor}
      />

      {/* 에러 */}
      {error && (
        <div style={{ color: '#EF4444', fontSize: '12px', padding: '10px 14px', background: '#FEF2F2', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={13} style={{ flexShrink: 0 }} />{error}
        </div>
      )}

      {/* 저장/삭제 버튼 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} disabled={saving}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '999px', padding: '11px 16px', fontSize: '11px', fontWeight: 900, letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, textTransform: 'uppercase' }}>
          {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
          {saving ? '저장 중...' : isNew ? '기사 추가' : '저장'}
        </button>
        <button onClick={onDelete} style={{ padding: '11px 16px', background: 'white', color: '#EF4444', border: '1px solid #FEE2E2', borderRadius: '999px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Trash2 size={12} />{isNew ? '취소' : '삭제'}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   추가 페이지 섹션 컴포넌트
   ════════════════════════════════════════════ */
function ArticlePagesSection({
  pages, setPages, saving, onSave, uploadingSlot, onImageUpload, accentColor, onFocusPage,
}: {
  pages: ArticlePage[];
  setPages: (pages: ArticlePage[]) => void;
  saving: boolean;
  onSave: () => void;
  uploadingSlot: { pageIdx: number; slotIdx: number } | null;
  onImageUpload: (pageIdx: number, slotIdx: number) => void;
  accentColor: string;
  onFocusPage: (pageIdx: number) => void;
}) {
  function addPage() {
    setPages([...pages, { article_id: 0, page_number: pages.length + 1, template: 'classic', content: '', images: [], captions: [] }]);
  }
  function deletePage(idx: number) {
    setPages(pages.filter((_, i) => i !== idx));
  }
  function movePage(idx: number, dir: 'up' | 'down') {
    const next = [...pages];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setPages(next);
  }
  function updatePage(idx: number, patch: Partial<ArticlePage>) {
    setPages(pages.map((p, i) => i === idx ? { ...p, ...patch } : p));
  }

  return (
    <div style={{ border: '1.5px solid #E8DDD4', borderRadius: '12px', overflow: 'hidden', marginTop: '10px' }}>
      {/* 헤더 */}
      <div style={{ background: '#FFF9F5', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9' }}>
        <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '3px', color: '#9C8B7A', margin: 0, textTransform: 'uppercase' }}>
          추가 페이지 {pages.length > 0 ? `(${pages.length})` : ''}
        </p>
        <span style={{ fontSize: '10px', color: '#CBD5E1' }}>기사 본문 이후 페이지</span>
      </div>

      {/* 페이지 없음 안내 */}
      {pages.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#CBD5E1', fontSize: '11px', fontWeight: 700 }}>
          추가 페이지가 없습니다
        </div>
      )}

      {/* 페이지 목록 */}
      {pages.map((page, pi) => {
        const photoCount = TEMPLATE_PHOTO_COUNT[page.template] ?? 0;
        return (
          <div key={pi} onClick={() => onFocusPage(pi)} style={{ padding: '14px', borderBottom: '1px solid #F8FAFC', background: 'white', cursor: 'default' }}>
            {/* 페이지 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '2px', color: '#4F46E5', textTransform: 'uppercase' }}>
                Page {pi + 2}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button type="button" onClick={() => movePage(pi, 'up')} disabled={pi === 0} style={{ padding: '3px 6px', border: '1px solid #F1F5F9', borderRadius: '5px', background: 'white', cursor: 'pointer', color: '#94A3B8', opacity: pi === 0 ? 0.3 : 1 }}>
                  <ChevronUp size={11} />
                </button>
                <button type="button" onClick={() => movePage(pi, 'down')} disabled={pi === pages.length - 1} style={{ padding: '3px 6px', border: '1px solid #F1F5F9', borderRadius: '5px', background: 'white', cursor: 'pointer', color: '#94A3B8', opacity: pi === pages.length - 1 ? 0.3 : 1 }}>
                  <ChevronDown size={11} />
                </button>
                <button type="button" onClick={() => deletePage(pi)} style={{ padding: '3px 6px', border: '1px solid #FEE2E2', borderRadius: '5px', background: 'white', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>

            {/* 템플릿 선택 — 카테고리별 + Legacy 안내 */}
            <div style={{ marginBottom: '10px' }}>
              <label style={labelStyle}>템플릿</label>
              {LEGACY_TEMPLATES.includes(page.template) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', marginBottom: '6px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '6px', fontSize: '10px', color: '#92400E' }}>
                  <AlertCircle size={11} style={{ flexShrink: 0 }} />
                  <span>현재 <strong>{page.template}</strong> (legacy) — 새 템플릿으로 교체 권장</span>
                </div>
              )}
              {TEMPLATE_CATEGORIES.map(cat => (
                <div key={cat.key} style={{ marginBottom: '6px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '2px', color: '#CBD5E1', textTransform: 'uppercase', margin: '0 0 3px' }}>{cat.label}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(cat.templates.length, 3)}, 1fr)`, gap: '4px' }}>
                    {cat.templates.map(t => (
                      <button key={t.key} type="button" onClick={() => updatePage(pi, { template: t.key, images: [], image_positions: [] })}
                        style={{ padding: '5px 4px', borderRadius: '6px', cursor: 'pointer', border: page.template === t.key ? `2px solid ${accentColor}` : '2px solid #F1F5F9', background: 'white', fontSize: '9px', fontWeight: 900, color: page.template === t.key ? accentColor : '#94A3B8', transition: 'all 0.15s' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 이미지 슬롯 + 9-point 포지션 */}
            {photoCount > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>사진 ({(page.images ?? []).filter(Boolean).length}/{photoCount})</label>
                <div style={{ display: 'grid', gridTemplateColumns: photoCount === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '6px' }}>
                  {Array.from({ length: photoCount }, (_, si) => {
                    const src = page.images?.[si] ?? '';
                    const pos = page.image_positions?.[si] ?? 'center';
                    const isUp = uploadingSlot?.pageIdx === pi && uploadingSlot?.slotIdx === si;
                    const POS_LABELS: Record<string, string> = { 'top left': '좌상', 'top': '상', 'top right': '우상', 'left': '좌', 'center': '중', 'right': '우', 'bottom left': '좌하', 'bottom': '하', 'bottom right': '우하' };
                    const POS_GRID = ['top left','top','top right','left','center','right','bottom left','bottom','bottom right'];
                    return (
                      <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div onClick={() => !isUp && onImageUpload(pi, si)}
                          style={{ border: '2px dashed #F1F5F9', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', background: '#F8FAFC', aspectRatio: '4/3', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {src
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos }} />
                            : <div style={{ color: '#CBD5E1', textAlign: 'center' }}>
                                {isUp ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={14} />}
                                <p style={{ fontSize: '9px', fontWeight: 700, margin: '2px 0 0' }}>사진 {si + 1}</p>
                              </div>
                          }
                          {src && (
                            <button type="button" onClick={e => { e.stopPropagation(); const imgs = [...(page.images ?? [])]; imgs[si] = ''; updatePage(pi, { images: imgs }); }}
                              style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                              <X size={10} />
                            </button>
                          )}
                        </div>
                        {src && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                            {POS_GRID.map(p => (
                              <button key={p} type="button" onClick={() => {
                                const positions = [...(page.image_positions ?? [])];
                                positions[si] = p;
                                updatePage(pi, { image_positions: positions });
                              }}
                                style={{ padding: '3px 2px', border: pos === p ? '1.5px solid #4F46E5' : '1px solid #F1F5F9', borderRadius: '4px', background: pos === p ? '#EEF2FF' : 'white', cursor: 'pointer', fontSize: '8px', fontWeight: 700, color: pos === p ? '#4F46E5' : '#CBD5E1', lineHeight: 1 }}>
                                {POS_LABELS[p]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 본문 — TipTap (메인 기사와 동일) */}
            <div style={{ marginBottom: '8px' }}>
              <label style={labelStyle}>본문</label>
              <Suspense fallback={<div style={{ ...inputStyle, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /></div>}>
                <TipTapEditor content={page.content} onChange={html => updatePage(pi, { content: html })} placeholder="페이지 본문 텍스트..." />
              </Suspense>
            </div>

            {/* 사진별 캡션 */}
            {photoCount > 0 && (
              <div>
                <label style={labelStyle}>사진 캡션 (선택)</label>
                {Array.from({ length: photoCount }, (_, si) => (
                  <input
                    key={si}
                    value={page.captions?.[si] ?? ''}
                    onChange={e => {
                      const caps = [...(page.captions ?? [])];
                      caps[si] = e.target.value;
                      updatePage(pi, { captions: caps });
                    }}
                    placeholder={`사진 ${si + 1} 설명 (선택)`}
                    style={{ ...inputStyle, marginTop: si > 0 ? '4px' : 0 }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* 하단 버튼 */}
      <div style={{ padding: '12px 14px', display: 'flex', gap: '8px', background: '#FAFAFA' }}>
        <button type="button" onClick={addPage}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'white', border: '1px dashed #CBD5E1', borderRadius: '10px', fontSize: '11px', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>
          <Plus size={11} /> 페이지 추가
        </button>
        <button type="button" onClick={onSave} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '10px', fontSize: '11px', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={11} />}
          {saving ? '저장 중...' : '추가 페이지 저장'}
        </button>
      </div>
    </div>
  );
}
