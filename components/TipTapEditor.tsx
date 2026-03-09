'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Bold, Italic, Heading2, Heading3, Quote, ImageIcon, Loader2,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function TipTapEditor({ content, onChange, placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      ImageExtension.configure({
        HTMLAttributes: { style: 'max-width:100%;height:auto;border-radius:12px;margin:16px 0;' },
      }),
      Placeholder.configure({
        placeholder: placeholder || '글 내용을 입력하세요...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: 'min-height:300px;outline:none;padding:20px 16px;font-size:15px;line-height:1.8;font-family:inherit;',
      },
    },
  });

  const insertImage = useCallback(async (file: File) => {
    if (!editor) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `blogs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) {
      alert('이미지 업로드 실패: ' + error.message);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    editor.chain().focus().setImage({ src: publicUrl }).run();
    setUploading(false);
  }, [editor]);

  if (!editor) return null;

  const btnStyle = (active: boolean) => ({
    padding: '8px 10px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    background: active ? '#1a1a1a' : 'transparent',
    color: active ? '#fff' : '#64748B',
    transition: 'all 0.15s',
  });

  return (
    <div style={{
      borderRadius: 16,
      border: '1px solid #F1F5F9',
      background: '#F8FAFC',
      overflow: 'hidden',
    }}>
      {/* 툴바 */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '8px 12px',
        borderBottom: '1px solid #F1F5F9',
        background: 'white',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btnStyle(editor.isActive('bold'))}>
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btnStyle(editor.isActive('italic'))}>
          <Italic size={16} />
        </button>

        <div style={{ width: 1, height: 20, background: '#F1F5F9', margin: '0 4px' }} />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btnStyle(editor.isActive('heading', { level: 2 }))}>
          <Heading2 size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={btnStyle(editor.isActive('heading', { level: 3 }))}>
          <Heading3 size={16} />
        </button>

        <div style={{ width: 1, height: 20, background: '#F1F5F9', margin: '0 4px' }} />

        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btnStyle(editor.isActive('blockquote'))}>
          <Quote size={16} />
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            ...btnStyle(false),
            opacity: uploading ? 0.5 : 1,
          }}
        >
          {uploading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={16} />}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) insertImage(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* 에디터 */}
      <style>{`
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94A3B8;
          pointer-events: none;
          height: 0;
        }
        .tiptap-editor .ProseMirror h2 { font-size: 24px; font-weight: 800; margin: 24px 0 12px; }
        .tiptap-editor .ProseMirror h3 { font-size: 20px; font-weight: 700; margin: 20px 0 10px; }
        .tiptap-editor .ProseMirror blockquote {
          border-left: 3px solid #cbd5e1;
          padding-left: 16px;
          margin: 16px 0;
          color: #64748B;
          font-style: italic;
        }
        .tiptap-editor .ProseMirror p { margin: 8px 0; }
        .tiptap-editor .ProseMirror img { max-width: 100%; height: auto; border-radius: 12px; margin: 16px 0; }
        .tiptap-editor .ProseMirror strong { font-weight: 700; }
        .tiptap-editor .ProseMirror em { font-style: italic; }
      `}</style>
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
