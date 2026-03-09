'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/SafeImage';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Blog } from '@/lib/types';
import DetailModal from './DetailModal';

interface Props {
  items: Blog[];
  heroLabel?: string;
}

export default function HeroCarousel({ items, heroLabel }: Props) {
  const [idx, setIdx] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Blog | null>(null);

  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => setIdx(p => (p + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <>
      <section style={{ position: 'relative', height: '85vh', width: '100%', overflow: 'hidden', background: '#f1f5f9' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              transition: 'opacity 1s ease',
              opacity: i === idx ? 1 : 0,
              zIndex: i === idx ? 10 : 0,
            }}
          >
            <SafeImage
              src={item.image_url}
              alt={item.title}
              fill
              className="object-cover"
              style={{ filter: 'saturate(1.5)' }}
              priority={i === 0}
            />
            <div
              className="hero-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 8%',
              }}
            >
              <span style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 'clamp(10px, 1.5vw, 14px)',
                fontWeight: 900,
                letterSpacing: 8,
                marginBottom: 24,
                textTransform: 'uppercase',
              }}>
                {heroLabel || 'Featured Story'}
              </span>
              <h2
                className="font-display hero-title"
              >
                {item.title}
              </h2>
              <button
                onClick={() => setSelectedItem(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: 'clamp(10px, 1.2vw, 12px)',
                  fontWeight: 900,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255,255,255,0.3)',
                  paddingBottom: 8,
                  width: 'fit-content',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s',
                  marginTop: 48,
                }}
              >
                Discover More <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ))}

        {/* Controls */}
        <div style={{
          position: 'absolute',
          bottom: 48,
          left: '8%',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIdx(p => (p - 1 + items.length) % items.length)}
              style={{
                padding: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                background: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                transition: 'all 0.3s',
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setIdx(p => (p + 1) % items.length)}
              style={{
                padding: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                background: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                transition: 'all 0.3s',
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {items.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 4,
                  width: i === idx ? 48 : 32,
                  borderRadius: 4,
                  background: i === idx ? 'white' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.4s',
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
}
