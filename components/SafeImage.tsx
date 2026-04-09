'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

const PLACEHOLDER = '/placeholder.svg';

function isUnoptimizable(src: ImageProps['src']): boolean {
  if (typeof src !== 'string') return false;
  const lower = src.toLowerCase().split('?')[0];
  return lower.endsWith('.svg') || lower.endsWith('.gif') || lower.includes('/icons/');
}

export default function SafeImage({ src, alt, unoptimized, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const shouldUnoptimize = unoptimized ?? isUnoptimizable(imgSrc);

  return (
    <Image
      {...props}
      alt={alt ?? ''}
      src={imgSrc}
      unoptimized={shouldUnoptimize}
      onError={() => setImgSrc(PLACEHOLDER)}
    />
  );
}
