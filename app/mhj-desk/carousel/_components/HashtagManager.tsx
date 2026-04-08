'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import { toast } from 'sonner';

const HASHTAG_CATEGORIES = [
  'education',
  'local',
  'parenting',
  'storypress',
  'settlement',
  'lunchbox',
  'immigration',
  'travel',
] as const;

type HashtagCategory = (typeof HASHTAG_CATEGORIES)[number];

interface Props {
  category: string;
  selectedHashtags: string[];
  onChange: (hashtags: string[]) => void;
}

export default function HashtagManager({ category, selectedHashtags, onChange }: Props) {
  const initial = (HASHTAG_CATEGORIES as readonly string[]).includes(category)
    ? (category as HashtagCategory)
    : 'storypress';
  const [activeCategory, setActiveCategory] = useState<HashtagCategory>(initial);
  const [draft, setDraft] = useState('');

  // Make sure #MHJnz always present
  useEffect(() => {
    if (!selectedHashtags.includes('#MHJnz')) {
      onChange(['#MHJnz', ...selectedHashtags]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHashtags.length]);

  async function loadPreset(cat: HashtagCategory) {
    setActiveCategory(cat);
    try {
      const { data } = await supabase
        .from('hashtag_presets')
        .select('hashtags')
        .eq('category', cat)
        .single();
      if (data?.hashtags && Array.isArray(data.hashtags)) {
        const merged = Array.from(new Set(['#MHJnz', ...(data.hashtags as string[])]));
        onChange(merged);
        toast.success(`${cat} 프리셋 불러옴`);
      } else {
        toast.warning(`${cat} 프리셋이 비어있습니다`);
      }
    } catch {
      toast.error('프리셋 로드 실패');
    }
  }

  function removeTag(tag: string) {
    if (tag === '#MHJnz') return;
    onChange(selectedHashtags.filter((t) => t !== tag));
  }

  function addDraft() {
    const cleaned = draft.trim().replace(/^#+/, '');
    if (!cleaned) return;
    const tag = `#${cleaned}`;
    if (selectedHashtags.includes(tag)) {
      toast.warning('이미 추가된 해시태그');
      setDraft('');
      return;
    }
    onChange([...selectedHashtags, tag]);
    setDraft('');
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
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
        Hashtags
      </p>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 2,
            color: '#94A3B8',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          프리셋
        </label>
        <select
          value={activeCategory}
          onChange={(e) => loadPreset(e.target.value as HashtagCategory)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            fontSize: 13,
            color: '#1A1A1A',
            outline: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {HASHTAG_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {selectedHashtags.length === 0 && (
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>아직 해시태그가 없습니다.</p>
        )}
        {selectedHashtags.map((tag) => {
          const locked = tag === '#MHJnz';
          return (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 999,
                background: locked ? '#FAF8F5' : '#F1F5F9',
                color: locked ? '#8A6B4F' : '#1A1A1A',
                border: `1px solid ${locked ? '#E8DFD2' : '#E2E8F0'}`,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {tag}
              {!locked && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`${tag} 제거`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 14,
                    height: 14,
                    border: 'none',
                    background: 'transparent',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </span>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="해시태그 추가 (엔터)"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            fontSize: 13,
            color: '#1A1A1A',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={addDraft}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: '#1A1A1A',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
