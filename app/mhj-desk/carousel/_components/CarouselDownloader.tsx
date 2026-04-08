'use client';

import { useState } from 'react';
import { Download, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import type { CarouselSlide } from '@/components/carousel/types';

interface Props {
  blogId: number | null;
  slides: CarouselSlide[];
  currentIndex: number;
  filenameBase: string;
}

async function base64ToBlob(base64: string, mime = 'image/png'): Promise<Blob> {
  const res = await fetch(`data:${mime};base64,${base64}`);
  return res.blob();
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const buf = new ArrayBuffer(len);
  const view = new Uint8Array(buf);
  for (let i = 0; i < len; i++) view[i] = binary.charCodeAt(i);
  return buf;
}

export default function CarouselDownloader({
  blogId,
  slides,
  currentIndex,
  filenameBase,
}: Props) {
  const [zipping, setZipping] = useState(false);
  const hasSlides = slides.length > 0;

  async function downloadZipServer() {
    if (!blogId) return;
    setZipping(true);
    try {
      const url = `/api/carousel/download?blogId=${blogId}&format=zip`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('서버 다운로드 실패');
      const blob = await res.blob();
      triggerDownload(blob, `${filenameBase}.zip`);
      toast.success('ZIP 다운로드');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '다운로드 실패');
    } finally {
      setZipping(false);
    }
  }

  async function downloadZipClient() {
    setZipping(true);
    try {
      const zip = new JSZip();
      slides.forEach((s, i) => {
        zip.file(
          `${filenameBase}-${String(i + 1).padStart(2, '0')}.png`,
          base64ToArrayBuffer(s.imageBase64)
        );
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(blob, `${filenameBase}.zip`);
      toast.success('ZIP 다운로드');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '다운로드 실패');
    } finally {
      setZipping(false);
    }
  }

  async function downloadCurrent() {
    if (!hasSlides) return;
    const slide = slides[currentIndex] || slides[0];
    const blob = await base64ToBlob(slide.imageBase64);
    const filename = `${filenameBase}-${String(currentIndex + 1).padStart(2, '0')}.png`;
    triggerDownload(blob, filename);
    toast.success(`슬라이드 ${currentIndex + 1} 다운로드`);
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const handleZipClick = blogId ? downloadZipServer : downloadZipClient;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
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
        Download
      </p>

      <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
        <button
          type="button"
          onClick={handleZipClick}
          disabled={!hasSlides || zipping}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '14px 16px',
            borderRadius: 10,
            border: 'none',
            background: hasSlides && !zipping ? '#8A6B4F' : '#F8FAFC',
            color: hasSlides && !zipping ? '#FFFFFF' : '#94A3B8',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            cursor: hasSlides && !zipping ? 'pointer' : 'not-allowed',
          }}
        >
          {zipping ? (
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Download size={14} />
          )}
          {zipping ? '압축 중...' : 'Download All (ZIP)'}
        </button>
        <button
          type="button"
          onClick={downloadCurrent}
          disabled={!hasSlides}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            color: hasSlides ? '#1A1A1A' : '#94A3B8',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            cursor: hasSlides ? 'pointer' : 'not-allowed',
          }}
        >
          <FileDown size={14} />
          현재 슬라이드만 (#{currentIndex + 1})
        </button>
      </div>
    </div>
  );
}
