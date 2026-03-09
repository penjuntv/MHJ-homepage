'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

const PLACEHOLDER = '/placeholder.svg';

export default function FallbackImage({ src, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...props}
      src={imgSrc}
      onError={() => setImgSrc(PLACEHOLDER)}
    />
  );
}
