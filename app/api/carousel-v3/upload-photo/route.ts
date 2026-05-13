import { NextRequest, NextResponse } from 'next/server';
import { uploadPhoto } from '@/lib/carousel-v3/db/photos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'multipart 폼 파싱 실패' }, { status: 400 });
  }

  const file = form.get('photo');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'photo 필드가 비어있거나 파일이 아닙니다' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `10MB 한도 초과 (현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
      { status: 400 },
    );
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `${file.type || 'unknown'} 미지원 — JPG/PNG/WEBP만 가능` },
      { status: 400 },
    );
  }

  try {
    const url = await uploadPhoto(file);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
