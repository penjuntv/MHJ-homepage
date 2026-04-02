import { NextRequest, NextResponse } from 'next/server';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const { data } = await supabase
    .from('affiliate_links')
    .select('destination_url, is_active')
    .eq('slug', slug)
    .single();

  if (!data) {
    notFound();
  }

  if (!data.is_active) {
    notFound();
  }

  // Fire-and-forget click count increment
  supabase.rpc('increment_affiliate_click', { link_slug: slug }).then(() => {});

  return NextResponse.redirect(data.destination_url, { status: 302 });
}
