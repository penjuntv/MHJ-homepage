// GET /api/carousel/download?blogId=66&format=zip
// GET /api/carousel/download?blogId=66&format=individual&slide=0
// 사양: docs/CAROUSEL_BUILD.md §5

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { createAdminClient } from '@/lib/supabase';
import {
  loadCarouselFonts,
  buildCarouselInputFromBlog,
} from '@/components/carousel/utils';
import { buildSlideBuffers } from '@/components/carousel/render';
import type { CarouselBlogRow } from '@/components/carousel/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const blogIdStr = searchParams.get('blogId');
    const format = (searchParams.get('format') || 'zip') as 'zip' | 'individual';
    const slideIdxStr = searchParams.get('slide');

    if (!blogIdStr) {
      return NextResponse.json({ error: 'blogId is required' }, { status: 400 });
    }
    const blogId = Number(blogIdStr);
    if (Number.isNaN(blogId)) {
      return NextResponse.json({ error: 'blogId must be a number' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: `blog not found: ${blogId}`, detail: error?.message },
        { status: 404 }
      );
    }

    const input = buildCarouselInputFromBlog(data as CarouselBlogRow);
    const fonts = await loadCarouselFonts(origin);
    const buffers = await buildSlideBuffers(input, fonts);

    const slug = (data as CarouselBlogRow).slug || `blog-${blogId}`;

    if (format === 'individual') {
      const idx = Number(slideIdxStr ?? '0');
      if (Number.isNaN(idx) || idx < 0 || idx >= buffers.length) {
        return NextResponse.json(
          { error: `slide index out of range: ${slideIdxStr}` },
          { status: 400 }
        );
      }
      const buf = buffers[idx];
      const bytes = new Uint8Array(buf);
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${slug}-${String(idx + 1).padStart(2, '0')}.png"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // zip
    const zip = new JSZip();
    buffers.forEach((buf, i) => {
      zip.file(`${slug}-${String(i + 1).padStart(2, '0')}.png`, buf);
    });
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    const zipBytes = new Uint8Array(zipBuf);

    return new Response(zipBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${slug}-carousel.zip"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'download failed', detail: message },
      { status: 500 }
    );
  }
}
