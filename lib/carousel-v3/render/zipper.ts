import JSZip from 'jszip';
import type { Aspect } from '../types';

export interface SlideRender {
  aspect: Aspect;
  index: number; // 1-based
  type: string;
  buffer: Buffer;
}

export async function createZip(renders: SlideRender[]): Promise<Buffer> {
  const zip = new JSZip();
  for (const r of renders) {
    const filename = `${String(r.index).padStart(2, '0')}_${r.type}.png`;
    zip.folder(r.aspect)!.file(filename, r.buffer);
  }
  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
