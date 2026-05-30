import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://edunode.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Protected app routes
          '/*/dashboard/',
          '/*/settings/',
          '/*/student-360/',
          '/*/analytics/',
          '/*/interventions/',
          '/*/network/',
          '/*/resources/',
          '/*/account/',
          '/*/authorizer/',
          '/*/search/',
          '/*/help/',
          '/*/notifications/',

          // Admin routes
          '/admin/',
          '/settings/',

          // Auth routes
          '/sign-in/',
          '/sign-up/',
          '/onboarding/',
          '/select-school/',
          '/unauthorized/',
          '/checkout/',

          // API routes
          '/api/',

          // Next.js internals
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
