/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    const staticRedirects = [
      { source: '/journal', destination: '/blog', permanent: true },
      { source: '/journal/:path*', destination: '/blog/:path*', permanent: true },
      // 삭제된 포스트 — Google이 404로 감지 (2026-06-18)
      { source: '/blog/education-006', destination: '/blog', permanent: true },
    ];

    const map = [
      ['Little 15 Mins', 'little-15-mins'],
      ['Home Learning', 'home-learning'],
      ['Whānau', 'whanau'],
      ['Settlement', 'settlement'],
      ['Life in Aotearoa', 'life-in-aotearoa'],
      ['Travelers', 'travelers'],
      ['Local Guide', 'local-guide'],
    ];
    // Next.js redirects 는 has 로 매칭한 query 를 destination 에 자동 carry-over 한다.
    // 1-hop 으로 ?category= 잔존을 제거할 방법이 없어 page.tsx 의 permanentRedirect 로
    // 2-hop 째에 깨끗한 URL 로 정리한다. 두 hop 모두 308(영구).
    // 페이지네이션이 ?page=N 쿼리 → 경로 세그먼트로 이전했다 (2026-09-08 P0-3-1).
    // 쿼리를 읽으면 라우트가 동적 렌더링으로 강등돼 CDN 캐시를 못 받는다(ARCHITECTURE §3.3).
    //
    // ⚠ page=1 을 일부러 제외한다. `?page=1 → /blog/page/1 → /blog`(query carry-over)
    //   가 되면 `/blog?page=1` 로 되돌아와 무한 루프가 된다.
    //   1쪽은 리다이렉트하지 않아도 된다 — /blog 가 더 이상 searchParams 를 읽지 않으므로
    //   ?page=1 은 그냥 무시되고 canonical 이 깨끗한 URL 을 가리킨다.
    const PAGE_GTE_2 = '(?<pg>[2-9]|[1-9][0-9]+)';
    const paginationRedirects = [
      { source: '/blog/page/1', destination: '/blog', permanent: true },
      { source: '/blog/category/:slug/page/1', destination: '/blog/category/:slug', permanent: true },
      {
        source: '/blog',
        has: [{ type: 'query', key: 'page', value: PAGE_GTE_2 }],
        destination: '/blog/page/:pg',
        permanent: true,
      },
      {
        source: '/blog/category/:slug',
        has: [{ type: 'query', key: 'page', value: PAGE_GTE_2 }],
        destination: '/blog/category/:slug/page/:pg',
        permanent: true,
      },
    ];

    // 순서가 중요하다: ?category= 규칙이 먼저 잡아야
    // /blog?category=X&page=2 가 카테고리 경로를 거쳐 페이지 경로로 간다.
    return [...staticRedirects, ...map.flatMap(([cat, slug]) => [
      {
        source: '/blog',
        has: [{ type: 'query', key: 'category', value: cat }],
        missing: [{ type: 'query', key: 'page' }],
        destination: `/blog/category/${slug}`,
        permanent: true,
      },
      {
        source: '/blog',
        has: [
          { type: 'query', key: 'category', value: cat },
          { type: 'query', key: 'page', value: '(?<page>.*)' },
        ],
        destination: `/blog/category/${slug}?page=:page`,
        permanent: true,
      },
    ]), ...paginationRedirects];
  },
  images: {
    minimumCacheTTL: 2678400,
    formats: ['image/webp'],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
      },
    ],
  },
};

export default nextConfig;
