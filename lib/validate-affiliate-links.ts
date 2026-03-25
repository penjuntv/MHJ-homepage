import { SupabaseClient } from '@supabase/supabase-js';

export interface AffiliateValidation {
  slug: string;
  status: 'valid' | 'inactive' | 'missing';
  title?: string;
}

export interface ValidateResult {
  validations: AffiliateValidation[];
  missingRelSlugs: string[];
}

export async function validateInfoBlockAffiliates(
  infoBlockHtml: string,
  supabase: SupabaseClient
): Promise<ValidateResult> {
  // 1. HTML에서 /go/ 링크 추출
  const goLinkRegex = /href=["']https?:\/\/(?:www\.)?mhj\.nz\/go\/([a-z0-9-]+)["']/gi;
  const slugs: string[] = [];
  let match;
  while ((match = goLinkRegex.exec(infoBlockHtml)) !== null) {
    if (!slugs.includes(match[1])) {
      slugs.push(match[1]);
    }
  }

  if (slugs.length === 0) return { validations: [], missingRelSlugs: [] };

  // 2. affiliate_links 테이블 일괄 조회
  const { data: links } = await supabase
    .from('affiliate_links')
    .select('slug, title, is_active')
    .in('slug', slugs);

  // 3. valid / inactive / missing 판별
  const validations: AffiliateValidation[] = slugs.map(slug => {
    const dbLink = links?.find(l => l.slug === slug);
    if (!dbLink) return { slug, status: 'missing' as const };
    if (!dbLink.is_active) return { slug, status: 'inactive' as const, title: dbLink.title };
    return { slug, status: 'valid' as const, title: dbLink.title };
  });

  // 4. rel="sponsored" 누락 체크
  // <a ...href="...mhj.nz/go/{slug}"...> 태그에서 rel 속성 확인
  const aTagRegex = /<a\s[^>]*href=["']https?:\/\/(?:www\.)?mhj\.nz\/go\/([a-z0-9-]+)["'][^>]*>/gi;
  const missingRelSlugs: string[] = [];
  let aMatch;
  while ((aMatch = aTagRegex.exec(infoBlockHtml)) !== null) {
    const fullTag = aMatch[0];
    const slug = aMatch[1];
    const relMatch = /\brel=["']([^"']*)["']/i.exec(fullTag);
    const hasSponsored = relMatch ? relMatch[1].split(/\s+/).includes('sponsored') : false;
    if (!hasSponsored && !missingRelSlugs.includes(slug)) {
      missingRelSlugs.push(slug);
    }
  }

  return { validations, missingRelSlugs };
}
