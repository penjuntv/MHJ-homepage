/**
 * Satori (@vercel/og) renderer entry. Session 1 dispatches to T3Quote only;
 * Session 2 will add T1/T2/T4/T5/T6 + tone presets beyond editorial.
 */

import { ImageResponse } from '@vercel/og';
import React from 'react';

import { CANVAS } from '../tokens';
import type { SlideInput } from '../types';
import { T3Quote } from '../templates/T3Quote';
import { loadCarouselFonts } from './fonts';

export async function renderWithSatori(slide: SlideInput): Promise<ImageResponse> {
  const fonts = await loadCarouselFonts();
  const { width, height } = CANVAS[slide.aspect];

  let element: React.ReactElement;
  switch (slide.type) {
    case 'quote':
      element = React.createElement(T3Quote, {
        data: slide.data,
        aspect: slide.aspect,
        tone: slide.tone,
      });
      break;
    default: {
      const _exhaustive: never = slide.type;
      throw new Error(`Unsupported slide type: ${_exhaustive}`);
    }
  }

  return new ImageResponse(element, {
    width,
    height,
    fonts,
  });
}
