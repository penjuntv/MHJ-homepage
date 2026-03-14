'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

const PLACEHOLDER = '/placeholder.svg';

export default function SafeImage({ src, alt, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...props}
      alt={alt ?? ''}
      src={imgSrc}
      onError={() => setImgSrc(PLACEHOLDER)}
    />
  );
}
