'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X } from 'lucide-react';

interface ImageCropModalProps {
  imageFile: File;
  onCropComplete: (croppedBlob: Blob, fileName: string) => void;
  onSkip: (originalFile: File) => void;
  onCancel: () => void;
  defaultAspect?: number;
}

const ASPECT_OPTIONS: { label: string; value: number | undefined }[] = [
  { label: '16:10', value: 16 / 10 },
  { label: '3:4', value: 3 / 4 },
  { label: '1:1', value: 1 },
  { label: '자유', value: undefined },
];

function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const quality = mimeType === 'image/jpeg' ? 0.9 : undefined;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      mimeType,
      quality,
    );
  });
}

export default function ImageCropModal({
  imageFile,
  onCropComplete,
  onSkip,
  onCancel,
  defaultAspect,
}: ImageCropModalProps) {
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(defaultAspect);
  const [applying, setApplying] = useState(false);

  // Read file into data URL
  useState(() => {
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(imageFile);
  });

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      imgRef.current = e.currentTarget;
      const { width, height } = e.currentTarget;

      // Set initial crop centered, 80% of image
      const a = aspect;
      let cropW: number, cropH: number;
      if (a) {
        if (width / height > a) {
          cropH = height * 0.8;
          cropW = cropH * a;
        } else {
          cropW = width * 0.8;
          cropH = cropW / a;
        }
      } else {
        cropW = width * 0.8;
        cropH = height * 0.8;
      }

      setCrop({
        unit: 'px',
        x: (width - cropW) / 2,
        y: (height - cropH) / 2,
        width: cropW,
        height: cropH,
      });
    },
    [aspect],
  );

  function handleAspectChange(newAspect: number | undefined) {
    setAspect(newAspect);
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    if (newAspect) {
      let cropW: number, cropH: number;
      if (width / height > newAspect) {
        cropH = height * 0.8;
        cropW = cropH * newAspect;
      } else {
        cropW = width * 0.8;
        cropH = cropW / newAspect;
      }
      setCrop({
        unit: 'px',
        x: (width - cropW) / 2,
        y: (height - cropH) / 2,
        width: cropW,
        height: cropH,
      });
    }
  }

  async function handleApply() {
    if (!imgRef.current || !completedCrop) return;
    setApplying(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop, imageFile.name);
      onCropComplete(blob, imageFile.name);
    } catch {
      onSkip(imageFile);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white', borderRadius: 16, maxWidth: 640, width: '100%',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #F1F5F9',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
            이미지 자르기
          </span>
          <button
            onClick={onCancel}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, display: 'flex', color: '#94A3B8',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Crop area */}
        <div style={{
          flex: 1, overflow: 'auto', padding: 20,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: '#F8FAFC', minHeight: 200,
        }}>
          {imgSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              style={{ maxHeight: '60vh' }}
            >
              <img
                src={imgSrc}
                onLoad={onImageLoad}
                alt="Crop preview"
                style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }}
              />
            </ReactCrop>
          ) : (
            <div style={{ color: '#94A3B8', fontSize: 13 }}>이미지 로딩 중...</div>
          )}
        </div>

        {/* Aspect buttons */}
        <div style={{
          display: 'flex', gap: 8, padding: '12px 20px',
          borderTop: '1px solid #F1F5F9',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginRight: 4 }}>
            비율:
          </span>
          {ASPECT_OPTIONS.map((opt) => {
            const isActive = aspect === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => handleAspectChange(opt.value)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: isActive ? '1.5px solid #1a1a1a' : '1.5px solid #E2E8F0',
                  background: isActive ? '#1a1a1a' : 'white',
                  color: isActive ? 'white' : '#64748B',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 16px', borderTop: '1px solid #F1F5F9',
        }}>
          <button
            onClick={() => onSkip(imageFile)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#94A3B8',
              padding: '8px 0',
            }}
          >
            원본 그대로
          </button>
          <button
            onClick={handleApply}
            disabled={!completedCrop || applying}
            style={{
              padding: '10px 28px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              background: completedCrop && !applying ? '#1a1a1a' : '#CBD5E1',
              color: 'white', border: 'none', cursor: completedCrop && !applying ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            {applying ? '적용 중...' : '적용'}
          </button>
        </div>
      </div>
    </div>
  );
}
