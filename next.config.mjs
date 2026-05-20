/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
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
    return map.flatMap(([cat, slug]) => [
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
    ]);
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
