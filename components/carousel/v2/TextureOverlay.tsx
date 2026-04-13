// Global Texture Overlay — noise / paper
// Renders as an absolutely-positioned overlay inside the slide

interface Props {
  texture?: 'none' | 'noise' | 'paper';
}

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`;

const PAPER_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)' opacity='0.05'/%3E%3C/svg%3E")`;

export default function TextureOverlay({ texture }: Props) {
  if (!texture || texture === 'none') return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: texture === 'noise' ? NOISE_SVG : PAPER_SVG,
        backgroundRepeat: 'repeat',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
