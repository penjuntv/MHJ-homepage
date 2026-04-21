import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/mhj-desk', '/go', '/blog/tag/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz'}/sitemap.xml`,
  };
}
