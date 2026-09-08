// PUBLIC_ROUTE_OK: 메일 링크의 구독 해지(공개). 이메일 주소 외 권한 없음.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * POST /api/unsubscribe
 * Body: { email: string }
 * Returns: { ok: true, already?: true }
 *
 * Sets subscribers.active = false for the given email.
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email?: string };

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const db = createAdminClient();

  // Check if subscriber exists and is active
  const { data: subscriber } = await db
    .from('subscribers')
    .select('id, active')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (!subscriber) {
    // Treat as success (don't reveal whether email exists)
    return NextResponse.json({ ok: true });
  }

  if (!subscriber.active) {
    return NextResponse.json({ ok: true, already: true });
  }

  await db
    .from('subscribers')
    .update({ active: false })
    .eq('id', subscriber.id);

  return NextResponse.json({ ok: true });
}
