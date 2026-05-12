/**
 * Satori (@vercel/og) renderer entry. Session 1 dispatches to T3Quote only;
 * Session 2 will add T1/T2/T4/T5/T6 + tone presets beyond editorial.
 */

import { ImageResponse } from '@vercel/og';
import React from 'react';

import { CANVAS } from '../tokens';
import type { SlideInput } from '../types';
import { T1Cover } from '../templates/T1Cover';
import { T3Quote } from '../templates/T3Quote';
import { T2Stat } from '../templates/T2Stat';
import { T6Outro } from '../templates/T6Outro';
import { T4Dialogue } from '../templates/T4Dialogue';
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
    case 'stat':
      element = React.createElement(T2Stat, {
        data: slide.data,
        aspect: slide.aspect,
        tone: slide.tone,
      });
      break;
    case 'outro':
      element = React.createElement(T6Outro, {
        data: slide.data,
        aspect: slide.aspect,
        tone: slide.tone,
      });
      break;
    case 'dialogue':
      element = React.createElement(T4Dialogue, {
        data: slide.data,
        aspect: slide.aspect,
        tone: slide.tone,
      });
      break;
    case 'cover':
      element = React.createElement(T1Cover, {
        data: slide.data,
        aspect: slide.aspect,
        tone: slide.tone,
      });
      break;
    default:
      throw new Error(`Unsupported slide type in Satori: ${(slide as SlideInput).type}`);
  }

  return new ImageResponse(element, {
    width,
    height,
    fonts,
  });
}
