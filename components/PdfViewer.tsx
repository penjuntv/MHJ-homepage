'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// CDN worker — pdfjs 5.x
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  url: string;
  currentPage: number;
  onLoadSuccess: (numPages: number) => void;
  width?: number;
}

export default function PdfViewer({ url, currentPage, onLoadSuccess, width = 800 }: Props) {
  return (
    <Document
      file={url}
      onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
      loading={
        <div style={{
          aspectRatio: '3/4',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{ color: '#94A3B8', fontSize: 12, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>
            Loading PDF...
          </p>
        </div>
      }
      error={
        <div style={{
          aspectRatio: '3/4',
          background: '#FEF2F2',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}>
          <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
            PDF Load Error
          </p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textDecoration: 'underline' }}
          >
            Open in new tab
          </a>
        </div>
      }
    >
      <Page
        pageNumber={currentPage}
        width={typeof window !== 'undefined' ? Math.min(width, window.innerWidth - 48) : width}
        renderAnnotationLayer
        renderTextLayer
      />
    </Document>
  );
}
