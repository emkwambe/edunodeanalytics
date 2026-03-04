import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://edunode.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  // Public marketing pages
  const publicPages = [
    '',
    '/about',
    '/pricing',
    '/demo',
    '/contact',
    '/security',
    '/integrations',
    '/case-studies',
    '/testimonials',
    '/partners',
    '/faq',
    '/blog',
    '/careers',
    '/webinars',
    '/roi-calculator',
    '/compare-plans',
    '/docs',
    '/docs/getting-started',
    '/docs/api',
    '/changelog',
    '/status',
    '/feedback',
  ];

  // Legal pages
  const legalPages = [
    '/terms',
    '/privacy',
    '/ferpa',
    '/cookies',
    '/accessibility',
  ];

  // Combine all public pages
  const allPublicPages = [...publicPages, ...legalPages];

  return allPublicPages.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: getPriority(route),
  }));
}

function getPriority(route: string): number {
  // Homepage gets highest priority
  if (route === '') return 1.0;

  // Core conversion pages
  if (['/pricing', '/demo', '/contact'].includes(route)) return 0.9;

  // Marketing pages
  if (['/about', '/case-studies', '/testimonials', '/roi-calculator'].includes(route)) return 0.8;

  // Documentation
  if (route.startsWith('/docs')) return 0.7;

  // Blog and resources
  if (['/blog', '/webinars', '/changelog', '/faq'].includes(route)) return 0.6;

  // Legal pages (lower priority but still crawlable)
  if (['/terms', '/privacy', '/ferpa', '/cookies', '/accessibility'].includes(route)) return 0.3;

  // Default
  return 0.5;
}
