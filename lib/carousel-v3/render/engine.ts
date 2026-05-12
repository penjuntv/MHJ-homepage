import { ImageResponse } from '@vercel/og';
import type { SlideInput } from '../types';
import { renderWithSatori } from './satori';

export async function renderCard(slide: SlideInput): Promise<ImageResponse> {
  if (slide.type === 'image-feature') {
    throw new Error('T5 requires Playwright fallback — implement in Session 2b');
  }
  return renderWithSatori(slide);
}
