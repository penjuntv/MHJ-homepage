'use client';

// MHJ Desk → Carousel Generator v2
// 렌더링: html-to-image (클라이언트) — Satori 서버 렌더링 교체
// docs/CAROUSEL_V2_MASTER_PLAN.md 세션 1

import { useCallback, useState } from 'react';
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
import LivePreview from '@/components/carousel/v2/LivePreview';
import ExportEngine from '@/components/carousel/v2/ExportEngine';

import BlogSelector from './_components/BlogSelector';
import CarouselEditor from './_components/CarouselEditor';
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
  const [mode, setMode] = useState<'blog' | 'independent'>('blog');
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
    setMode('independent');
    setBlogId(null);
    setBlogSlug('independent');
    setContentId(null);
    setInput(EMPTY_INPUT);
    setSlides([]);
    setCurrentSlide(0);
    setCaption(EMPTY_CAPTION);
    setAltTexts([]);
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
        body: JSON.stringify({ input, caption, blogId, contentId }),
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
          <BlogSelector
            mode={mode}
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
            {mode === 'blog' && (
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
          />
          <CaptionPanel caption={caption} onChange={setCaption} altTexts={altTexts} />
          <HashtagManager
            category={blogCategoryToHashtagCategory(input.category)}
            selectedHashtags={caption.hashtags}
            onChange={(hashtags) => setCaption({ ...caption, hashtags })}
          />
          <ExportEngine slides={slides} filenameBase={filenameBase} />
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
          setMode(row.blog_id ? 'blog' : 'independent');
          setBlogId(row.blog_id);
          setBlogSlug(row.title.replace(/\s+/g, '-').toLowerCase().slice(0, 40) || 'recent');
          setContentId(row.id);
          setInput({ ...EMPTY_INPUT, ...row.data });
          setCaption({
            en: row.caption_en || '',
            kr: row.caption_kr || '',
            hashtags: row.hashtags || ['#MHJnz'],
          });
          setSlides([]);
          setCurrentSlide(0);
          setAltTexts([]);
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
