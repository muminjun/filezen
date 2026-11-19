import { MetadataRoute } from 'next';
import { locales } from '@/i18n';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 1,
  }));
}
