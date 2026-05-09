import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import CoverPreview from '@/components/magazine/CoverPreview';

export const dynamic = 'force-dynamic';

// CoverPreview 는 420×550 고정 크기.
// 800/420 = 1.90476 으로 scale 하면 800×1047(≈800×550×1.9048) 렌더.
const SCALE = 800 / 420;

interface Props {
  params: Promise<{ magazine_id: string }>;
}

export default async function CoverRenderPage({ params }: Props) {
  const { magazine_id } = await params;

  const supabase = createAdminClient();
  const { data: magazine } = await supabase
    .from('magazines')
    .select('*')
    .eq('id', magazine_id)
    .single();

  if (!magazine) notFound();

  return (
    <div
      style={{
        width: '800px',
        height: '1047px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
        }}
      >
        <CoverPreview
          title={magazine.title}
          year={magazine.year}
          month_name={magazine.month_name}
          cover_copy={magazine.cover_copy ?? ''}
          cover_subtitle={magazine.cover_subtitle ?? ''}
          contributors={magazine.contributors ?? []}
          image_url={magazine.image_url ?? ''}
          cover_images={[]}
          accent_color={magazine.accent_color ?? '#1A1A1A'}
          bg_color={magazine.bg_color ?? '#F5F0EA'}
          cover_filter={magazine.cover_filter ?? 'none'}
          issue_number={magazine.issue_number ?? undefined}
        />
      </div>
    </div>
  );
}
