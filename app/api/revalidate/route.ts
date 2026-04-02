import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, paths, all } = body;

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const ALL_PUBLIC_PATHS = ['/', '/about', '/blog', '/magazine', '/storypress'];

  try {
    const targetPaths = all ? ALL_PUBLIC_PATHS : (paths as string[]);
    for (const path of targetPaths) {
      revalidatePath(path);
    }
    return NextResponse.json({ revalidated: true, paths: targetPaths });
  } catch {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
