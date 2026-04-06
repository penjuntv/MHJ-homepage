'use client';

import {
  useEditor, EditorContent,
  NodeViewWrapper, ReactNodeViewRenderer,
} from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import UnderlineExtension from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import YoutubeExtension from '@tiptap/extension-youtube';
import { Node, mergeAttributes } from '@tiptap/core';
import { useRef, useCallback, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import {
  Bold, Italic, Heading2, Heading3, Quote, ImageIcon, Loader2,
  AlignLeft, AlignCenter, AlignRight, Underline, Strikethrough,
  Link2, Link2Off, Minus, Highlighter, ChevronDown,
  MapPin, Youtube, MessageSquare, MousePointer2,
} from 'lucide-react';


/* ════════════════════════════════════════
   CUSTOM NODE EXTENSIONS
════════════════════════════════════════ */

/* ── ImageGrid ── */
const ImageGridNode = Node.create({
  name: 'imageGrid',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      layout: {
        default: '2',
        parseHTML: el => el.getAttribute('data-layout') || '2',
        renderHTML: () => ({}),
      },
      urls: {
        default: [],
        parseHTML: el => Array.from(el.querySelectorAll('img')).map(img => img.getAttribute('src') || ''),
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() { return [{ tag: 'div[data-layout]' }]; },
  renderHTML({ node }) {
    const { layout, urls } = node.attrs as { layout: string; urls: string[] };
    const cols: Record<string, string> = { '2': '1fr 1fr', '3': '1fr 1fr 1fr', '1+2': '1fr 1fr' };
    const classes: Record<string, string> = { '2': 'image-grid grid-2', '3': 'image-grid grid-3', '1+2': 'image-grid grid-1-2' };
    const dom = document.createElement('div');
    dom.className = classes[layout] ?? 'image-grid grid-2';
    dom.setAttribute('data-layout', layout);
    dom.style.cssText = `display:grid;grid-template-columns:${cols[layout] ?? '1fr 1fr'};gap:8px;margin:24px 0;`;
    (urls || []).forEach((url: string, i: number) => {
      const img = document.createElement('img');
      img.src = url; img.alt = '';
      img.style.cssText = 'width:100%;border-radius:12px;object-fit:cover;height:100%;' +
        (layout === '1+2' && i === 0 ? 'grid-row:span 2;' : '');
      dom.appendChild(img);
    });
    return { dom };
  },
  addNodeView() { return ReactNodeViewRenderer(ImageGridView); },
});

/* ── YouTube (official extension + backward compat) ── */
const CustomYoutube = YoutubeExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      // CSS class for frontend styling
      HTMLAttributes: { default: { class: 'blog-youtube' } },
    };
  },
  parseHTML() {
    return [
      // Official format: div[data-youtube-video]
      ...(this.parent?.() || []),
      // Legacy format: div.blog-youtube > iframe
      {
        tag: 'div.blog-youtube',
        getAttrs: (el: HTMLElement) => {
          const iframe = el.querySelector('iframe');
          const src = iframe?.getAttribute('src') || '';
          const m = src.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
          return m ? { src: src } : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    // Wrap in div.blog-youtube for consistent frontend styling
    return ['div', { class: 'blog-youtube', 'data-youtube-video': '' }, ['iframe', mergeAttributes(
      this.options.HTMLAttributes,
      { allowfullscreen: 'true', loading: 'lazy' },
      HTMLAttributes,
    )]];
  },
});

/* ── MapEmbed ── */
const MapEmbedNode = Node.create({
  name: 'mapEmbed',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      address: {
        default: '',
        parseHTML: el => {
          const src = el.querySelector('iframe')?.getAttribute('src') || '';
          const m = src.match(/q=([^&]*)/);
          return m ? decodeURIComponent(m[1]) : '';
        },
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() { return [{ tag: 'div.blog-map' }]; },
  renderHTML({ node }) {
    const dom = document.createElement('div');
    dom.className = 'blog-map';
    dom.style.cssText = 'margin:32px 0;border-radius:16px;overflow:hidden;';
    const iframe = document.createElement('iframe');
    iframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(node.attrs.address)}&output=embed`;
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '300');
    iframe.style.cssText = 'border:0;display:block;';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    dom.appendChild(iframe);
    return { dom };
  },
  addNodeView() { return ReactNodeViewRenderer(MapEmbedView); },
});

/* ── CtaButton ── */
const CtaButtonNode = Node.create({
  name: 'ctaButton',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      text: { default: 'Click Here', parseHTML: el => el.querySelector('a')?.textContent || '', renderHTML: () => ({}) },
      href: { default: '#', parseHTML: el => el.querySelector('a')?.getAttribute('href') || '#', renderHTML: () => ({}) },
      newTab: { default: true, parseHTML: el => el.querySelector('a')?.getAttribute('target') === '_blank', renderHTML: () => ({}) },
    };
  },
  parseHTML() { return [{ tag: 'div.blog-cta' }]; },
  renderHTML({ node }) {
    const dom = document.createElement('div');
    dom.className = 'blog-cta';
    dom.style.cssText = 'text-align:center;margin:32px 0;';
    const a = document.createElement('a');
    a.href = node.attrs.href;
    a.textContent = node.attrs.text;
    if (node.attrs.newTab) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    a.style.cssText = 'display:inline-block;padding:16px 40px;background:#1A1A1A;color:white;border-radius:999px;font-weight:800;text-decoration:none;font-size:13px;letter-spacing:1px;';
    dom.appendChild(a);
    return { dom };
  },
  addNodeView() { return ReactNodeViewRenderer(CtaButtonView); },
});

/* ── CalloutBlock ── */
const CalloutBlockNode = Node.create({
  name: 'calloutBlock',
  group: 'block',
  content: 'inline*',
  parseHTML() { return [{ tag: 'div.blog-callout' }]; },
  renderHTML() {
    return ['div', {
      class: 'blog-callout',
      style: 'padding:24px;background:#EEF2FF;border-left:3px solid #4F46E5;border-radius:0 12px 12px 0;margin:24px 0;',
    }, 0];
  },
});


/* ════════════════════════════════════════
   CUSTOM NODE VIEWS
════════════════════════════════════════ */

function ImageGridView({ node, selected }: NodeViewProps) {
  const { layout, urls } = node.attrs as { layout: string; urls: string[] };
  const safe = urls || [];
  const cols = layout === '3' ? 'repeat(3,1fr)' : '1fr 1fr';
  return (
    <NodeViewWrapper>
      <div contentEditable={false} style={{
        display: 'grid', gridTemplateColumns: cols, gap: 8,
        margin: '16px 0', borderRadius: 12, overflow: 'hidden',
        outline: selected ? '2px solid #4F46E5' : 'none', outlineOffset: 2,
      }}>
        {safe.map((url, i) => (
          <div key={i} style={{
            gridRow: layout === '1+2' && i === 0 ? 'span 2' : undefined,
            aspectRatio: layout === '1+2' ? (i === 0 ? '3/4' : '3/2') : '4/3',
            overflow: 'hidden',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  );
}

function MapEmbedView({ node, selected }: NodeViewProps) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(node.attrs.address)}&output=embed`;
  return (
    <NodeViewWrapper>
      <div contentEditable={false} style={{
        margin: '16px 0', borderRadius: 16, overflow: 'hidden',
        outline: selected ? '2px solid #4F46E5' : 'none', outlineOffset: 2,
      }}>
        <iframe src={src} width="100%" height="300" style={{ border: 'none', display: 'block' }} allowFullScreen loading="lazy" />
      </div>
    </NodeViewWrapper>
  );
}

function CtaButtonView({ node, selected }: NodeViewProps) {
  return (
    <NodeViewWrapper>
      <div contentEditable={false} style={{
        textAlign: 'center', margin: '24px 0',
        outline: selected ? '2px solid #4F46E5' : 'none', borderRadius: 999, outlineOffset: 2,
      }}>
        <span style={{
          display: 'inline-block', padding: '16px 40px',
          background: '#1A1A1A', color: 'white', borderRadius: 999,
          fontWeight: 800, fontSize: 13, letterSpacing: 1, cursor: 'default',
        }}>
          {node.attrs.text}
        </span>
        <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
          → {node.attrs.href}
        </span>
      </div>
    </NodeViewWrapper>
  );
}

/* ════════════════════════════════════════
   IMAGE TOOLBAR & NODE VIEW (existing)
════════════════════════════════════════ */

function ImageToolbar({ align, width, updateAttributes }: {
  align: string; width: string;
  updateAttributes: (attrs: Record<string, string>) => void;
}) {
  const alignOpts = [
    { value: 'left', icon: <AlignLeft size={14} /> },
    { value: 'center', icon: <AlignCenter size={14} /> },
    { value: 'right', icon: <AlignRight size={14} /> },
  ] as const;
  const widths = ['25%', '50%', '75%', '100%'] as const;
  const base: React.CSSProperties = {
    padding: '5px 7px', borderRadius: 7, border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s', fontFamily: 'inherit',
  };
  return (
    <div style={{
      position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50, display: 'flex', alignItems: 'center', gap: 2,
      padding: '5px 8px', background: 'white', border: '1px solid #F1F5F9',
      borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
    }}>
      {alignOpts.map(opt => (
        <button key={opt.value} type="button"
          onMouseDown={e => { e.preventDefault(); updateAttributes({ align: opt.value }); }}
          style={{ ...base, background: align === opt.value ? '#1a1a1a' : 'transparent', color: align === opt.value ? '#fff' : '#64748B' }}
        >{opt.icon}</button>
      ))}
      <div style={{ width: 1, height: 18, background: '#F1F5F9', margin: '0 3px' }} />
      {widths.map(w => (
        <button key={w} type="button"
          onMouseDown={e => { e.preventDefault(); updateAttributes({ width: w }); }}
          style={{ ...base, padding: '4px 8px', fontSize: 10, fontWeight: 900, letterSpacing: 0.5, background: width === w ? '#1a1a1a' : 'transparent', color: width === w ? '#fff' : '#64748B' }}
        >{w}</button>
      ))}
    </div>
  );
}

function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const align: string = node.attrs.align ?? 'center';
  const width: string = node.attrs.width ?? '100%';
  const justifyMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
  return (
    <NodeViewWrapper style={{ display: 'flex', justifyContent: justifyMap[align] ?? 'center', margin: '16px 0' }}>
      <div contentEditable={false} style={{ position: 'relative', width, transition: 'width 0.2s', flexShrink: 0 }}>
        {selected && <ImageToolbar align={align} width={width} updateAttributes={updateAttributes} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={node.attrs.src} alt={node.attrs.alt} data-align={align} data-width={width}
          style={{ width: '100%', height: 'auto', borderRadius: 12, display: 'block',
            outline: selected ? '2px solid #4F46E5' : 'none', outlineOffset: 2, transition: 'outline 0.15s' }}
        />
      </div>
    </NodeViewWrapper>
  );
}

const CustomImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: { default: 'center', parseHTML: el => el.getAttribute('data-align') ?? 'center', renderHTML: attrs => ({ 'data-align': attrs.align }) },
      width: { default: '100%', parseHTML: el => el.getAttribute('data-width') ?? '100%', renderHTML: attrs => ({ 'data-width': attrs.width }) },
    };
  },
  renderHTML({ HTMLAttributes }) { return ['img', mergeAttributes(HTMLAttributes)]; },
  addNodeView() { return ReactNodeViewRenderer(ImageNodeView); },
});

/* ════════════════════════════════════════
   MODAL OVERLAY HELPER
════════════════════════════════════════ */
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 24, padding: 28,
        maxWidth: 520, width: '100%', maxHeight: '85vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   SLOT UPLOAD AREA (for image modal)
════════════════════════════════════════ */
function SlotArea({ slot, onFile, onUrl, label }: {
  slot: { url: string; uploading: boolean };
  onFile: (f: File) => void;
  onUrl: (u: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      {slot.url ? (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3', background: '#f1f5f9' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slot.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <button type="button" onClick={() => onUrl('')}
            style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} style={{
          border: '2px dashed #e2e8f0', borderRadius: 12, aspectRatio: '4/3',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, cursor: 'pointer', background: '#fafafa', transition: 'all 0.2s',
        }}>
          {slot.uploading
            ? <Loader2 size={20} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />
            : <ImageIcon size={20} color="#94a3b8" />}
          <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
            {slot.uploading ? '업로드 중...' : '클릭해서 업로드'}
          </p>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN EDITOR
════════════════════════════════════════ */
interface Props { content: string; onChange: (html: string) => void; placeholder?: string; }

type ImageLayout = '1' | '2' | '3' | '1+2';
interface SlotState { url: string; uploading: boolean; }
type InsertModalType = 'youtube' | 'maps' | 'cta' | null;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function youtubeToEmbed(url: string): string {
  // Standard: youtube.com/watch?v=ID or youtu.be/ID
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  // Shorts: youtube.com/shorts/ID
  const shorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
  // Already an embed URL
  if (url.includes('youtube.com/embed/')) return url;
  return url;
}

export default function TipTapEditor({ content, onChange, placeholder }: Props) {
  const [uploading, setUploading] = useState(false);

  // Image modal
  const [imageModal, setImageModal] = useState<{ layout: ImageLayout; slots: SlotState[] } | null>(null);
  const openImageModal = () => setImageModal({ layout: '1', slots: [{ url: '', uploading: false }] });
  const changeImageLayout = (layout: ImageLayout) => {
    const count = layout === '1' ? 1 : layout === '2' ? 2 : 3;
    setImageModal({ layout, slots: Array.from({ length: count }, () => ({ url: '', uploading: false })) });
  };

  // Link modal
  const [linkModal, setLinkModal] = useState<{ url: string; newTab: boolean } | null>(null);

  // Insert modals
  const [insertModal, setInsertModal] = useState<InsertModalType>(null);
  const [insertData, setInsertData] = useState({ text: '', url: '', address: '' });

  // Native color pickers + selection snapshot
  // 컬러 피커를 열면 editor focus/selection이 사라지므로 미리 저장해서 복원
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const savedColorSel = useRef<{ from: number; to: number } | null>(null);
  const savedHighlightSel = useRef<{ from: number; to: number } | null>(null);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const insertMenuRef = useRef<HTMLDivElement>(null);

  // Close insert menu on outside click — ref.contains 방식 사용 (stopPropagation 방식은
  // document 레벨 네이티브 리스너와 React 합성 이벤트 실행 순서 경합으로 드롭다운 항목
  // 클릭 시 click 이벤트가 소실되는 버그 발생)
  useEffect(() => {
    if (!showInsertMenu) return;
    const h = (e: MouseEvent) => {
      if (insertMenuRef.current && !insertMenuRef.current.contains(e.target as HTMLElement)) {
        setShowInsertMenu(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showInsertMenu]);

  const uploadAndInsert = useCallback(async (file: File) => {
    if (!editor) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('jpg, png, webp, gif 형식만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      alert('이미지 크기는 5MB를 초과할 수 없습니다.');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `blog/inline-images/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) { alert('업로드 실패: ' + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    editor.chain().focus().setImage({ src: publicUrl }).run();
    setUploading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadSlotImage = async (slotIdx: number, file: File) => {
    setImageModal(prev => {
      if (!prev) return prev;
      const slots = [...prev.slots];
      slots[slotIdx] = { ...slots[slotIdx], uploading: true };
      return { ...prev, slots };
    });
    const ext = file.name.split('.').pop();
    const path = `blogs/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) {
      alert('업로드 실패: ' + error.message);
      setImageModal(prev => {
        if (!prev) return prev;
        const slots = [...prev.slots];
        slots[slotIdx] = { ...slots[slotIdx], uploading: false };
        return { ...prev, slots };
      });
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    setImageModal(prev => {
      if (!prev) return prev;
      const slots = [...prev.slots];
      slots[slotIdx] = { url: publicUrl, uploading: false };
      return { ...prev, slots };
    });
  };

  const confirmImageModal = () => {
    if (!editor || !imageModal) return;
    const filled = imageModal.slots.filter(s => s.url);
    if (filled.length === 0) { alert('이미지를 업로드하세요.'); return; }
    const urls = filled.map(s => s.url);
    if (imageModal.layout === '1' || urls.length === 1) {
      editor.chain().focus().setImage({ src: urls[0] }).run();
    } else {
      editor.chain().focus().insertContent({
        type: 'imageGrid',
        attrs: { layout: imageModal.layout, urls },
      }).run();
    }
    setImageModal(null);
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      CustomImage,
      UnderlineExtension,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || '글 내용을 입력하세요...' }),
      ImageGridNode,
      CustomYoutube.configure({
        HTMLAttributes: { class: 'blog-youtube' },
        allowFullscreen: true,
        autoplay: false,
        interfaceLanguage: 'ko',
      }),
      MapEmbedNode,
      CtaButtonNode,
      CalloutBlockNode,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: 'min-height:320px;outline:none;padding:20px 16px;font-size:15px;line-height:1.8;font-family:inherit;',
      },
      handleDOMEvents: {
        drop: (_view, event) => {
          const files = Array.from((event as DragEvent).dataTransfer?.files ?? []);
          const imgs = files.filter(f => f.type.startsWith('image/'));
          if (imgs.length > 0) {
            event.preventDefault();
            imgs.forEach(f => uploadAndInsert(f));
            return true;
          }
          return false;
        },
        dragover: (_view, event) => { event.preventDefault(); return false; },
        paste: (_view, event) => {
          const items = Array.from((event as ClipboardEvent).clipboardData?.items ?? []);
          const imgItems = items.filter(item => item.type.startsWith('image/'));
          if (imgItems.length > 0) {
            event.preventDefault();
            imgItems.forEach(item => {
              const file = item.getAsFile();
              if (file) uploadAndInsert(file);
            });
            return true;
          }
          return false;
        },
      },
    },
  });

  if (!editor) return null;

  const btn = (active: boolean, danger = false): React.CSSProperties => ({
    padding: '7px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? '#1a1a1a' : danger ? '#fef2f2' : 'transparent',
    color: active ? '#fff' : danger ? '#ef4444' : '#64748B',
    transition: 'all 0.15s', flexShrink: 0,
  });
  const sep = <div style={{ width: 1, height: 20, background: '#f1f5f9', margin: '0 3px', flexShrink: 0 }} />;

  /* ── 현재 텍스트 색상 ── */
  const currentColor = editor.getAttributes('textStyle').color || '';
  const currentHighlight = editor.getAttributes('highlight').color || '';

  return (
    <div style={{ borderRadius: 16, border: '1px solid #F1F5F9', background: '#F8FAFC', overflow: 'visible', position: 'relative' }}>

      {/* ── TOOLBAR ── */}
      <div style={{
        display: 'flex', gap: 2, padding: '8px 10px',
        borderBottom: '1px solid #F1F5F9', background: 'white',
        flexWrap: 'wrap', alignItems: 'center', borderRadius: '16px 16px 0 0',
      }}>
        {/* Bold / Italic / Underline / Strike */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btn(editor.isActive('bold'))} title="굵게"><Bold size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btn(editor.isActive('italic'))} title="기울임"><Italic size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} style={btn(editor.isActive('underline'))} title="밑줄"><Underline size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} style={btn(editor.isActive('strike'))} title="취소선"><Strikethrough size={15} /></button>
        {sep}

        {/* H2 / H3 */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btn(editor.isActive('heading', { level: 2 }))} title="제목2"><Heading2 size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={btn(editor.isActive('heading', { level: 3 }))} title="제목3"><Heading3 size={15} /></button>
        {sep}

        {/* Text Color — 네이티브 컬러 피커 */}
        <div style={{ position: 'relative' }}>
          <button type="button" title="글자 색상"
            onClick={() => {
              // 피커 열기 전 selection 저장 (피커가 열리면 editor selection이 사라짐)
              const sel = editor.state.selection;
              savedColorSel.current = { from: sel.from, to: sel.to };
              colorInputRef.current?.click();
            }}
            style={{ ...btn(false), flexDirection: 'column', gap: 1, padding: '5px 8px' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: currentColor || '#1a1a1a', lineHeight: 1 }}>A</span>
            <div style={{ width: 14, height: 3, borderRadius: 2, background: currentColor || '#1a1a1a' }} />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={currentColor || '#1a1a1a'}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1, top: 0, left: 0, padding: 0, border: 'none' }}
            onChange={e => {
              const sel = savedColorSel.current;
              if (sel) {
                editor.chain().focus().setTextSelection({ from: sel.from, to: sel.to }).setColor(e.target.value).run();
                savedColorSel.current = null;
              } else {
                editor.chain().focus().setColor(e.target.value).run();
              }
            }}
          />
        </div>

        {/* Highlight — 네이티브 컬러 피커 */}
        <div style={{ position: 'relative' }}>
          <button type="button" title="형광펜"
            onClick={() => {
              const sel = editor.state.selection;
              savedHighlightSel.current = { from: sel.from, to: sel.to };
              highlightInputRef.current?.click();
            }}
            style={{ ...btn(editor.isActive('highlight')), padding: '5px 8px' }}>
            <Highlighter size={15} />
          </button>
          <input
            ref={highlightInputRef}
            type="color"
            value={currentHighlight || '#FEF08A'}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1, top: 0, left: 0, padding: 0, border: 'none' }}
            onChange={e => {
              const sel = savedHighlightSel.current;
              if (sel) {
                editor.chain().focus().setTextSelection({ from: sel.from, to: sel.to }).setHighlight({ color: e.target.value }).run();
                savedHighlightSel.current = null;
              } else {
                editor.chain().focus().setHighlight({ color: e.target.value }).run();
              }
            }}
          />
        </div>
        {sep}

        {/* Align */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} style={btn(editor.isActive({ textAlign: 'left' }))} title="왼쪽 정렬"><AlignLeft size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} style={btn(editor.isActive({ textAlign: 'center' }))} title="가운데 정렬"><AlignCenter size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} style={btn(editor.isActive({ textAlign: 'right' }))} title="오른쪽 정렬"><AlignRight size={15} /></button>
        {sep}

        {/* Blockquote / HR */}
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btn(editor.isActive('blockquote'))} title="인용구"><Quote size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} style={btn(false)} title="구분선"><Minus size={15} /></button>
        {sep}

        {/* Image */}
        <button type="button" onClick={openImageModal} disabled={uploading} style={{ ...btn(false), opacity: uploading ? 0.5 : 1 }} title="이미지 삽입">
          {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={15} />}
        </button>

        {/* Link */}
        <button type="button"
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              const attrs = editor.getAttributes('link');
              setLinkModal({ url: attrs.href || '', newTab: attrs.target === '_blank' });
            }
          }}
          style={btn(editor.isActive('link'))} title={editor.isActive('link') ? '링크 제거' : '링크 삽입'}>
          {editor.isActive('link') ? <Link2Off size={15} /> : <Link2 size={15} />}
        </button>
        {sep}

        {/* Insert Dropdown */}
        <div ref={insertMenuRef} style={{ position: 'relative' }}>
          <button type="button"
            onClick={() => setShowInsertMenu(!showInsertMenu)}
            style={{ ...btn(false), gap: 4, padding: '7px 10px', fontSize: 11, fontWeight: 700 }}>
            삽입 <ChevronDown size={12} />
          </button>
          {showInsertMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 200,
              background: 'white', borderRadius: 12, padding: '6px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9',
              minWidth: 160,
            }}>
              {[
                { type: 'youtube' as InsertModalType, icon: <Youtube size={14} />, label: 'YouTube 임베드' },
                { type: 'maps' as InsertModalType, icon: <MapPin size={14} />, label: 'Google Maps' },
                { type: 'cta' as InsertModalType, icon: <MousePointer2 size={14} />, label: 'CTA 버튼' },
              ].map(item => (
                <button key={item.type!} type="button"
                  onClick={() => {
                    setInsertData({ text: '', url: '', address: '' });
                    setInsertModal(item.type);
                    setShowInsertMenu(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: '#1a1a1a', textAlign: 'left',
                    transition: 'background 0.1s',
                  }}>
                  <span style={{ color: '#64748b' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 6px' }} />
              <button type="button"
                onClick={() => {
                  if (!editor) return;
                  editor.chain().focus().insertContent({ type: 'calloutBlock', content: [{ type: 'text', text: '이 부분에 강조할 내용을 입력하세요.' }] }).run();
                  setShowInsertMenu(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: '#1a1a1a', textAlign: 'left',
                }}>
                <span style={{ color: '#64748b' }}><MessageSquare size={14} /></span>
                콜아웃 박스
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── EDITOR STYLES ── */}
      <style>{`
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder); float: left; color: #94A3B8; pointer-events: none; height: 0;
        }
        .tiptap-editor .ProseMirror h2 { font-size: 22px; font-weight: 800; margin: 24px 0 10px; }
        .tiptap-editor .ProseMirror h3 { font-size: 18px; font-weight: 700; margin: 20px 0 8px; }
        .tiptap-editor .ProseMirror blockquote {
          border-left: 3px solid #cbd5e1; padding-left: 16px; margin: 16px 0;
          color: #64748B; font-style: italic;
        }
        .tiptap-editor .ProseMirror p { margin: 6px 0; }
        .tiptap-editor .ProseMirror strong { font-weight: 700; }
        .tiptap-editor .ProseMirror em { font-style: italic; }
        .tiptap-editor .ProseMirror u { text-decoration: underline; }
        .tiptap-editor .ProseMirror s { text-decoration: line-through; }
        .tiptap-editor .ProseMirror a { color: #4F46E5; text-decoration: underline; text-underline-offset: 3px; }
        .tiptap-editor .ProseMirror hr { border: none; border-top: 2px solid #f1f5f9; margin: 24px 0; }
        .tiptap-editor .ProseMirror ul, .tiptap-editor .ProseMirror ol { padding-left: 24px; margin: 8px 0; }
        .tiptap-editor .ProseMirror li { margin: 4px 0; }
        .tiptap-editor .ProseMirror [data-type="calloutBlock"],
        .tiptap-editor .ProseMirror div.blog-callout {
          padding: 16px 20px; background: #EEF2FF;
          border-left: 3px solid #4F46E5; border-radius: 0 10px 10px 0;
          margin: 16px 0; color: #1a1a1a;
        }
        .tiptap-editor .ProseMirror div[data-youtube-video],
        .tiptap-editor .ProseMirror div.blog-youtube {
          margin: 16px 0; border-radius: 8px; overflow: hidden;
          aspect-ratio: 16/9; background: #000;
          border: 1px solid #f1f5f9;
        }
        .tiptap-editor .ProseMirror div[data-youtube-video] iframe,
        .tiptap-editor .ProseMirror div.blog-youtube iframe {
          width: 100%; height: 100%; border: none; display: block;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>

      {/* ── IMAGE MODAL ── */}
      {imageModal && (
        <ModalOverlay onClose={() => setImageModal(null)}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>이미지 삽입</h2>

          {/* 레이아웃 선택 */}
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>배치 방식</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {([
              { value: '1', label: '1개', desc: '전체 너비' },
              { value: '2', label: '2열', desc: '50:50' },
              { value: '3', label: '3열', desc: '33:33:33' },
              { value: '1+2', label: '1+2', desc: '큰1 + 작은2' },
            ] as const).map(opt => (
              <button key={opt.value} type="button"
                onClick={() => changeImageLayout(opt.value)}
                style={{
                  padding: '10px 8px', borderRadius: 12, border: '1.5px solid',
                  borderColor: imageModal.layout === opt.value ? '#4F46E5' : '#f1f5f9',
                  background: imageModal.layout === opt.value ? '#eef2ff' : 'white',
                  cursor: 'pointer', textAlign: 'center',
                }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: imageModal.layout === opt.value ? '#4F46E5' : '#1a1a1a', marginBottom: 2 }}>{opt.label}</p>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* 슬롯 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: imageModal.layout === '3' ? 'repeat(3,1fr)' : imageModal.layout === '1' ? '1fr' : 'repeat(2,1fr)',
            gap: 12, marginBottom: 24,
          }}>
            {imageModal.slots.map((slot, idx) => (
              <SlotArea key={idx}
                slot={slot}
                label={imageModal.layout === '1+2' && idx === 0 ? '큰 이미지' : `이미지 ${idx + 1}`}
                onFile={f => uploadSlotImage(idx, f)}
                onUrl={u => setImageModal(prev => {
                  if (!prev) return prev;
                  const slots = [...prev.slots];
                  slots[idx] = { ...slots[idx], url: u };
                  return { ...prev, slots };
                })}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={confirmImageModal}
              style={{ flex: 1, padding: '13px', background: '#1a1a1a', color: 'white', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              삽입
            </button>
            <button type="button" onClick={() => setImageModal(null)}
              style={{ padding: '13px 20px', background: '#f8fafc', color: '#64748b', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              취소
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── LINK MODAL ── */}
      {linkModal && (
        <ModalOverlay onClose={() => setLinkModal(null)}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>링크 삽입</h2>
          {linkModal.url && (
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
              {(() => { try { return new URL(linkModal.url).hostname; } catch { return linkModal.url; } })()}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <input
              value={linkModal.url}
              onChange={e => setLinkModal(prev => prev ? { ...prev, url: e.target.value } : prev)}
              placeholder="https://..."
              style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 14, outline: 'none', background: '#f8fafc' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={linkModal.newTab}
                onChange={e => setLinkModal(prev => prev ? { ...prev, newTab: e.target.checked } : prev)}
                style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>새 탭에서 열기</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button"
              onClick={() => {
                if (!linkModal.url) return;
                editor.chain().focus().setLink({ href: linkModal.url, target: linkModal.newTab ? '_blank' : '_self' }).run();
                setLinkModal(null);
              }}
              style={{ flex: 1, padding: '13px', background: '#1a1a1a', color: 'white', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              링크 적용
            </button>
            {editor.isActive('link') && (
              <button type="button"
                onClick={() => { editor.chain().focus().unsetLink().run(); setLinkModal(null); }}
                style={btn(false, true)}>
                <Link2Off size={16} />
              </button>
            )}
            <button type="button" onClick={() => setLinkModal(null)}
              style={{ padding: '13px 20px', background: '#f8fafc', color: '#64748b', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              취소
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── INSERT MODALS (YouTube / Maps / CTA) ── */}
      {insertModal && (
        <ModalOverlay onClose={() => setInsertModal(null)}>
          {insertModal === 'youtube' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Youtube size={20} color="#ef4444" />
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>YouTube 임베드</h2>
              </div>
              <input
                autoFocus
                value={insertData.url}
                onChange={e => setInsertData(d => ({ ...d, url: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const url = insertData.url.trim();
                    if (!url || !editor) return;
                    editor.commands.setYoutubeVideo({ src: youtubeToEmbed(url) });
                    setInsertModal(null);
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=... 또는 Shorts URL"
                style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box', marginBottom: 20 }}
              />
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 20, lineHeight: 1.5 }}>
                일반 영상, Shorts, youtu.be 단축 URL 모두 지원됩니다.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button"
                  onClick={() => {
                    const url = insertData.url.trim();
                    if (!url || !editor) return;
                    editor.commands.setYoutubeVideo({ src: youtubeToEmbed(url) });
                    setInsertModal(null);
                  }}
                  style={{ flex: 1, padding: '13px', background: '#1a1a1a', color: 'white', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                  삽입
                </button>
                <button type="button" onClick={() => setInsertModal(null)}
                  style={{ padding: '13px 20px', background: '#f8fafc', color: '#64748b', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  취소
                </button>
              </div>
            </>
          )}

          {insertModal === 'maps' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <MapPin size={20} color="#22c55e" />
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Google Maps</h2>
              </div>
              <input
                autoFocus
                value={insertData.address}
                onChange={e => setInsertData(d => ({ ...d, address: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (!insertData.address.trim() || !editor) return;
                    editor.chain().focus().insertContent({ type: 'mapEmbed', attrs: { address: insertData.address.trim() } }).run();
                    setInsertModal(null);
                  }
                }}
                placeholder="주소 또는 장소명 (예: Auckland Sky Tower)"
                style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box', marginBottom: 20 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button"
                  onClick={() => {
                    if (!insertData.address.trim() || !editor) return;
                    editor.chain().focus().insertContent({ type: 'mapEmbed', attrs: { address: insertData.address.trim() } }).run();
                    setInsertModal(null);
                  }}
                  style={{ flex: 1, padding: '13px', background: '#1a1a1a', color: 'white', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                  삽입
                </button>
                <button type="button" onClick={() => setInsertModal(null)}
                  style={{ padding: '13px 20px', background: '#f8fafc', color: '#64748b', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  취소
                </button>
              </div>
            </>
          )}

          {insertModal === 'cta' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <MousePointer2 size={20} color="#4F46E5" />
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>CTA 버튼</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <input
                  autoFocus
                  value={insertData.text}
                  onChange={e => setInsertData(d => ({ ...d, text: e.target.value }))}
                  placeholder="버튼 텍스트 (예: 더 보기)"
                  style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 14, outline: 'none', background: '#f8fafc' }}
                />
                <input
                  value={insertData.url}
                  onChange={e => setInsertData(d => ({ ...d, url: e.target.value }))}
                  placeholder="링크 URL"
                  style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 14, outline: 'none', background: '#f8fafc' }}
                />
                {/* 미리보기 */}
                {insertData.text && (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <span style={{
                      display: 'inline-block', padding: '14px 36px',
                      background: '#1A1A1A', color: 'white', borderRadius: 999,
                      fontWeight: 800, fontSize: 13, letterSpacing: 1,
                    }}>{insertData.text}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button"
                  onClick={() => {
                    if (!insertData.text.trim() || !editor) return;
                    editor.chain().focus().insertContent({
                      type: 'ctaButton',
                      attrs: { text: insertData.text.trim(), href: insertData.url.trim() || '#', newTab: true },
                    }).run();
                    setInsertModal(null);
                  }}
                  style={{ flex: 1, padding: '13px', background: '#1a1a1a', color: 'white', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                  삽입
                </button>
                <button type="button" onClick={() => setInsertModal(null)}
                  style={{ padding: '13px 20px', background: '#f8fafc', color: '#64748b', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  취소
                </button>
              </div>
            </>
          )}
        </ModalOverlay>
      )}

    </div>
  );
}
