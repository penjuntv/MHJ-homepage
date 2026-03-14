'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// 로컬 worker (public 폴더에 복사된 파일 사용 → CDN 의존 없음)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface Props {
  url: string;
  currentPage: number;
  onLoadSuccess: (numPages: number) => void;
}

export default function PdfViewer({ url, currentPage, onLoadSuccess }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  /* ── ResizeObserver로 컨테이너 실제 너비 추적 ─────────────────
     Page width={containerWidth} 로 PDF가 컨테이너를 정확히 채움
     → 우측 잘림 없음, PDF 원본 비율 자동 유지                    */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setContainerWidth(el.clientWidth);
    update(); // 초기값

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {containerWidth > 0 && (
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
          loading={
            <div style={{
              aspectRatio: '3/4',
              background: '#F5F0EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <p style={{ color: '#9C8B7A', fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>
                Loading...
              </p>
            </div>
          }
          error={
            <div style={{
              aspectRatio: '3/4',
              background: '#FEF2F2',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
                PDF Load Error
              </p>
              <a href={url} target="_blank" rel="noreferrer"
                style={{ color: '#9C8B7A', fontSize: 11, textDecoration: 'underline' }}>
                Open in new tab
              </a>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={containerWidth}
            renderAnnotationLayer
            renderTextLayer
            error={
              <div style={{
                aspectRatio: '3/4',
                background: '#FEF2F2',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', margin: 0 }}>
                  Page not found
                </p>
                <p style={{ color: '#9C8B7A', fontSize: 11, margin: 0 }}>
                  This page may not exist in the PDF
                </p>
              </div>
            }
          />
        </Document>
      )}
    </div>
  );
}
