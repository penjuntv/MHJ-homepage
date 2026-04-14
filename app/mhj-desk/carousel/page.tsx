'use client';

// MHJ Desk → Carousel Generator v2
// 렌더링: html-to-image (클라이언트) — Satori 서버 렌더링 교체
// docs/CAROUSEL_V2_MASTER_PLAN.md 세션 1

import { useCallback, useRef, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-browser';
import {
  buildCarouselInputFromBlog,
  blogCategoryToHashtagCategory,
  generateCaption,
  generateAltTexts,
} from '@/components/carousel/utils';
import type {
  CarouselBlogRow,
  CarouselInput,
  SlideConfig,
} from '@/components/carousel/types';
import { convertInputToSlides } from '@/components/carousel/v2/convertInput';
import LivePreview, { type AspectRatio } from '@/components/carousel/v2/LivePreview';
import ExportEngine from '@/components/carousel/v2/ExportEngine';

import BlogSelector from './_components/BlogSelector';
import CarouselEditor from './_components/CarouselEditor';
import AiGeneratePanel from './_components/AiGeneratePanel';
import CaptionPanel, { type CaptionState } from './_components/CaptionPanel';
import HashtagManager from './_components/HashtagManager';
import RecentList from './_components/RecentList';

const EMPTY_INPUT: CarouselInput = {
  category: 'storypress',
  style: 'default',
  title: '',
  subtitle: '',
  titleKr: '',
  coverImageUrl: '',
  points: [
    { title: '', body: '', highlight: '', highlightKr: '', highlightZh: '' },
    { title: '', body: '', highlight: '', highlightKr: '', highlightZh: '' },
    { title: '', body: '', highlight: '', highlightKr: '', highlightZh: '' },
    { title: '', body: '', highlight: '', highlightKr: '', highlightZh: '' },
  ],
  visualImageUrl: '',
  pullQuote: '',
  summaryPoints: ['', '', '', ''],
  summaryKr: ['', '', '', ''],
  yussiTake: '',
  yussiTakeKr: '',
  ctaTitle: 'Read the full article',
  ctaUrl: '',
  brandName: 'MHJ',
  instagramHandle: '@mhj_nz',
};

const EMPTY_CAPTION: CaptionState = {
  en: '',
  kr: '',
  hashtags: ['#MHJnz'],
};

export default function CarouselAdminPage() {
  const [mode, setMode] = useState<'blog' | 'ai' | 'manual'>('blog');
  const [blogId, setBlogId] = useState<number | null>(null);
  const [blogSlug, setBlogSlug] = useState<string>('');
  const [contentId, setContentId] = useState<number | null>(null);
  const [input, setInput] = useState<CarouselInput>(EMPTY_INPUT);
  const [slides, setSlides] = useState<SlideConfig[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [savingBlog, setSavingBlog] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [caption, setCaption] = useState<CaptionState>(EMPTY_CAPTION);
  const [altTexts, setAltTexts] = useState<string[]>([]);
  const [recentRefresh, setRecentRefresh] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('portrait');

  // Undo/Redo — yussi-inata 패턴
  const pastRef = useRef<SlideConfig[][]>([]);
  const futureRef = useRef<SlideConfig[][]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [undoVersion, setUndoVersion] = useState(0); // force re-render on undo/redo state change

  const pushHistory = useCallback((current: SlideConfig[]) => {
    pastRef.current = [...pastRef.current, current];
    futureRef.current = [];
    setUndoVersion((n) => n + 1);
  }, []);

  const handleUpdateSlide = useCallback(
    (index: number, patch: Partial<SlideConfig>) => {
      setSlides((prev) => {
        pushHistory(prev);
        return prev.map((s, i) => (i === index ? { ...s, ...patch } : s));
      });
    },
    [pushHistory],
  );

  const handleUndo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    setSlides((current) => {
      futureRef.current = [current, ...futureRef.current];
      return previous;
    });
    setUndoVersion((n) => n + 1);
  }, []);

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    setSlides((current) => {
      pastRef.current = [...pastRef.current, current];
      return next;
    });
    setUndoVersion((n) => n + 1);
  }, []);

  const handleSelectBlog = useCallback((row: CarouselBlogRow) => {
    setMode('blog');
    setBlogId(row.id);
    setBlogSlug(row.slug || `blog-${row.id}`);
    setContentId(null);
    const built = buildCarouselInputFromBlog(row);
    // 빈 carousel_*면 buildCarouselInputFromBlog가 비어있는 points/summary를 만든다.
    // UI에서 4개씩 채우려면 EMPTY_INPUT의 빈 슬롯을 머지.
    setInput({
      ...EMPTY_INPUT,
      ...built,
      points: built.points.length > 0 ? built.points : EMPTY_INPUT.points,
      summaryPoints:
        built.summaryPoints.length > 0 ? built.summaryPoints : EMPTY_INPUT.summaryPoints,
      summaryKr:
        built.summaryKr && built.summaryKr.length > 0 ? built.summaryKr : EMPTY_INPUT.summaryKr,
      category: row.category,
    });
    setSlides([]);
    setCurrentSlide(0);
    setCaption(EMPTY_CAPTION);
    setAltTexts([]);
  }, []);

  const handleNewIndependent = useCallback(() => {
    setMode('manual');
    setBlogId(null);
    setBlogSlug('independent');
    setContentId(null);
    setInput(EMPTY_INPUT);
    setSlides([]);
    setCurrentSlide(0);
    setCaption(EMPTY_CAPTION);
    setAltTexts([]);
  }, []);

  // AI Generate 모드: Gemini가 반환한 SlideConfig[] 직접 적용
  const handleAiSlides = useCallback((aiSlides: SlideConfig[]) => {
    setSlides(aiSlides);
    setCurrentSlide(0);
    pastRef.current = [];
    futureRef.current = [];
    setUndoVersion((n) => n + 1);
    // 간단한 캡션/해시태그 생성
    setCaption({
      en: aiSlides[0]?.title ? `${aiSlides[0].title}\n\n👉 Swipe for the full story\n\n💾 Save · 📩 Share · 💬 Comment\n\n#MHJnz` : '',
      kr: '',
      hashtags: ['#MHJnz'],
    });
    setAltTexts(aiSlides.map((s, i) => `Slide ${i + 1}: ${s.title || s.layout}`));
  }, []);

  // Manual 모드: 10개 빈 슬라이드 생성
  const handleManualCreate = useCallback(() => {
    const defaultLayouts: SlideConfig[] = [
      { id: 1, layout: 'cover-minimal', title: 'Your Title Here', subtitle: 'CATEGORY', stepNumber: 1 },
      { id: 2, layout: 'content-quote', title: '', body: 'Your quote or introduction here', stepNumber: 2 },
      { id: 3, layout: 'content-step', title: 'Point 1', body: 'Description...', stepNumber: 3 },
      { id: 4, layout: 'content-editorial', title: 'Point 2', body: 'Description...', stepNumber: 4 },
      { id: 5, layout: 'content-split', title: 'Point 3', body: 'Description...', stepNumber: 5 },
      { id: 6, layout: 'content-photo-overlay', title: 'Point 4', body: 'Description...', stepNumber: 6 },
      { id: 7, layout: 'visual-break', title: '', body: 'A powerful quote', stepNumber: 7 },
      { id: 8, layout: 'summary-checklist', title: 'Key Takeaways', body: 'Item 1\nItem 2\nItem 3\nItem 4', stepNumber: 8 },
      { id: 9, layout: 'yussi-take', title: "Yussi's Take", body: 'Personal perspective...', stepNumber: 9 },
      { id: 10, layout: 'cta-minimal', title: 'Save & share this.', subtitle: 'www.mhj.nz', stepNumber: 10 },
    ];
    setSlides(defaultLayouts);
    setCurrentSlide(0);
    pastRef.current = [];
    futureRef.current = [];
    setUndoVersion((n) => n + 1);
    setCaption(EMPTY_CAPTION);
    setAltTexts([]);
    toast.success('10장 빈 슬라이드 생성됨 — 편집하세요');
  }, []);

  // v2: 클라이언트 사이드 슬라이드 생성 (서버 API 불필요)
  function handleGenerate() {
    if (!input.title.trim()) {
      toast.error('Title은 필수입니다');
      return;
    }
    setGenerating(true);
    try {
      const newSlides = convertInputToSlides(input);
      setSlides(newSlides);
      setCurrentSlide(0);

      // 캡션 + 해시태그 + alt texts 생성
      const hashtags = Array.from(new Set(['#MHJnz', `#${input.category.replace(/\s+/g, '')}`]));
      const { captionEn, captionKr } = generateCaption(input, hashtags);
      setCaption({
        en: captionEn,
        kr: captionKr || '',
        hashtags,
      });
      setAltTexts(generateAltTexts(input));
      toast.success(`${newSlides.length}장 슬라이드 생성 완료`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '생성 실패');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveBlog() {
    if (!blogId) {
      toast.error('블로그를 먼저 선택하세요');
      return;
    }
    setSavingBlog(true);
    const { error } = await supabase
      .from('blogs')
      .update({
        carousel_enabled: true,
        carousel_title: input.title,
        carousel_subtitle: input.subtitle,
        carousel_points: input.points,
        carousel_summary: input.summaryPoints,
        carousel_summary_kr: input.summaryKr,
        carousel_yussi_take: input.yussiTake,
        carousel_yussi_take_kr: input.yussiTakeKr,
        carousel_cta: input.ctaTitle,
        carousel_style: input.style,
        carousel_generated_at: slides.length > 0 ? new Date().toISOString() : null,
        // v2: slides는 SlideConfig[] — DB에는 generated_at만 기록
      })
      .eq('id', blogId);
    setSavingBlog(false);
    if (error) {
      toast.error(`저장 실패: ${error.message}`);
    } else {
      toast.success('블로그 carousel 데이터 저장됨');
      setRecentRefresh((n) => n + 1);
    }
  }

  async function handleSaveContent() {
    setSavingContent(true);
    try {
      const res = await fetch('/api/carousel/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, caption, blogId, contentId, slides }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || 'save 실패');
      setContentId(json.id);
      toast.success('instagram_content에 저장됨');
      setRecentRefresh((n) => n + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSavingContent(false);
    }
  }

  const filenameBase = `mhj-carousel-${blogSlug || 'untitled'}`;

  return (
    <div
      style={{
        padding: '32px 28px 80px',
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* HEADER */}
      <header>
        <h1
          className="font-display font-black uppercase"
          style={{ fontSize: 40, letterSpacing: -1.5, margin: 0, color: '#1A1A1A' }}
        >
          Carousel Generator
        </h1>
        <p
          className="font-black uppercase"
          style={{
            fontSize: 10,
            letterSpacing: 4,
            marginTop: 6,
            marginBottom: 0,
            color: '#94A3B8',
          }}
        >
          Instagram 캐러셀 10장 자동 생성
        </p>
      </header>

      {/* MAIN GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'flex-start',
        }}
        className="carousel-admin-grid"
      >
        {/* LEFT: source + editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* MODE TABS — Blog | AI Generate | Manual */}
          <div style={{
            display: 'flex', gap: 0, background: '#F1F5F9', borderRadius: 10, padding: 3,
          }}>
            {([
              { id: 'blog' as const, label: 'Blog' },
              { id: 'ai' as const, label: 'AI Generate' },
              { id: 'manual' as const, label: 'Manual' },
            ]).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id);
                  if (tab.id === 'manual') handleNewIndependent();
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: mode === tab.id ? '#FFFFFF' : 'transparent',
                  color: mode === tab.id ? '#1A1A1A' : '#64748B',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: mode === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Blog mode */}
          {mode === 'blog' && (
            <>
              <BlogSelector
                mode="blog"
                selectedBlogId={blogId}
                onSelectBlog={handleSelectBlog}
                onNewIndependent={handleNewIndependent}
              />
              <CarouselEditor
                input={input}
                onChange={setInput}
                onGenerate={handleGenerate}
                isGenerating={generating}
              />
            </>
          )}

          {/* AI Generate mode */}
          {mode === 'ai' && (
            <AiGeneratePanel onSlidesGenerated={handleAiSlides} />
          )}

          {/* Manual mode */}
          {mode === 'manual' && (
            <div style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20,
              display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
            }}>
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: '#94A3B8', textTransform: 'uppercase', margin: 0, alignSelf: 'flex-start' }}>
                Manual Mode
              </p>
              <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                10장의 빈 슬라이드를 생성하고, 오른쪽 편집 패널에서 레이아웃·텍스트·색상을 자유롭게 편집하세요.
              </p>
              <button
                type="button"
                onClick={handleManualCreate}
                style={{
                  padding: '14px 28px', borderRadius: 10, border: 'none',
                  background: '#1A1A1A', color: '#FFFFFF',
                  fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Create 10 Empty Slides
              </button>
            </div>
          )}

          {/* SAVE BUTTONS */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <p
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 3,
                color: '#94A3B8',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Save
            </p>
            {mode === 'blog' && blogId && (
              <button
                type="button"
                onClick={handleSaveBlog}
                disabled={savingBlog || !blogId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: savingBlog || !blogId ? '#F8FAFC' : '#1A1A1A',
                  color: savingBlog || !blogId ? '#94A3B8' : '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  cursor: savingBlog || !blogId ? 'not-allowed' : 'pointer',
                }}
              >
                {savingBlog ? (
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Save size={13} />
                )}
                Save to Blog (carousel_*)
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveContent}
              disabled={savingContent || !input.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: savingContent || !input.title ? '#F8FAFC' : '#FFFFFF',
                color: savingContent || !input.title ? '#94A3B8' : '#1A1A1A',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                cursor: savingContent || !input.title ? 'not-allowed' : 'pointer',
              }}
            >
              {savingContent ? (
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Save size={13} />
              )}
              {contentId ? `Update content #${contentId}` : 'Save as Independent'}
            </button>
          </div>
        </div>

        {/* RIGHT: preview + caption + downloader */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            minWidth: 0,
            position: 'sticky',
            top: 24,
          }}
        >
          <LivePreview
            slides={slides}
            currentIndex={currentSlide}
            onIndexChange={setCurrentSlide}
            onUpdateSlide={handleUpdateSlide}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={pastRef.current.length > 0}
            canRedo={futureRef.current.length > 0}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
          />
          <CaptionPanel caption={caption} onChange={setCaption} altTexts={altTexts} />
          <HashtagManager
            category={blogCategoryToHashtagCategory(input.category)}
            selectedHashtags={caption.hashtags}
            onChange={(hashtags) => setCaption({ ...caption, hashtags })}
          />
          <ExportEngine slides={slides} filenameBase={filenameBase} aspectRatio={aspectRatio} />
        </div>
      </div>

      {/* RECENT */}
      <RecentList
        refreshSignal={recentRefresh}
        onLoad={(row) => {
          if (!row.data) {
            toast.error('이 콘텐츠는 데이터가 없습니다');
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawData = row.data as any;
          const restoredInput = { ...EMPTY_INPUT, ...(rawData || {}) };
          setMode(row.blog_id ? 'blog' : 'manual');
          setBlogId(row.blog_id);
          setBlogSlug(row.title.replace(/\s+/g, '-').toLowerCase().slice(0, 40) || 'recent');
          setContentId(row.id);
          setInput(restoredInput);
          setCaption({
            en: row.caption_en || '',
            kr: row.caption_kr || '',
            hashtags: row.hashtags || ['#MHJnz'],
          });

          // 슬라이드 복원 (저장된 slides가 있으면 사용, 없으면 재생성)
          if (rawData?.slides && Array.isArray(rawData.slides)) {
            setSlides(rawData.slides);
          } else {
            setSlides(convertInputToSlides(restoredInput));
          }
          setCurrentSlide(0);
          setAltTexts([]);
          // undo/redo 초기화
          pastRef.current = [];
          futureRef.current = [];
          toast.success(`"${row.title}" 로드됨`);
        }}
      />

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .carousel-admin-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
