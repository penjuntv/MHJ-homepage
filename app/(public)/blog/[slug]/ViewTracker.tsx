'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { canCountView } from '@/lib/first-party';

/** 글 조회수 +1 — 탭 세션당 글마다 한 번. 운영자 제외 기기·자동 브라우저·로봇은 세지 않는다(canCountView). */
export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!canCountView()) return;
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    (async () => {
      try {
        await supabase.rpc('increment_view_count', { blog_slug: slug });
      } catch {
        // ignore view count failures silently
      }
    })();
  }, [slug]);

  return null;
}
