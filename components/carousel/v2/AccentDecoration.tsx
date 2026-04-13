// Accent Icon Decoration — renders a selected NZ icon as a decorative element

import type { CSSProperties } from 'react';
import { NZ_ACCENT_ICONS, type NZAccentIconId } from './NZIcons';

interface Props {
  iconId?: string;
  color?: string;
  opacity?: number;
  size?: number;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'center';
  style?: CSSProperties;
}

export default function AccentDecoration({
  iconId,
  color = '#C9A882',
  opacity = 0.08,
  size = 200,
  position = 'bottom-right',
  style,
}: Props) {
  if (!iconId) return null;

  const Icon = NZ_ACCENT_ICONS[iconId as NZAccentIconId];
  if (!Icon) return null;

  const posStyles: Record<string, CSSProperties> = {
    'top-right': { top: 40, right: 40 },
    'bottom-right': { bottom: 80, right: 40 },
    'bottom-left': { bottom: 80, left: 40 },
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  };

  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        color,
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
        ...posStyles[position],
        ...style,
      }}
    >
      <Icon width="100%" height="100%" />
    </div>
  );
}
