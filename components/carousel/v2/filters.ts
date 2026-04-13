// Image Filters — from yussi-inata (8 CSS filter presets)

export const IMAGE_FILTERS = [
  { id: 'none', name: 'Normal', style: 'none' },
  { id: 'grayscale', name: 'Grayscale', style: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepia', style: 'sepia(100%)' },
  { id: 'blur', name: 'Blur', style: 'blur(4px)' },
  { id: 'darken', name: 'Darken', style: 'brightness(70%)' },
  { id: 'lighten', name: 'Lighten', style: 'brightness(130%)' },
  { id: 'vibrant', name: 'Vibrant', style: 'saturate(200%)' },
  { id: 'contrast', name: 'High Contrast', style: 'contrast(150%)' },
] as const;

export type ImageFilterId = (typeof IMAGE_FILTERS)[number]['id'];

export function getFilterStyle(filterId?: string): string | undefined {
  if (!filterId || filterId === 'none') return undefined;
  const f = IMAGE_FILTERS.find((x) => x.id === filterId);
  return f?.style === 'none' ? undefined : f?.style;
}
