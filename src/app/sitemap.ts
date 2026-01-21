import { MetadataRoute } from 'next';
import { getAllBooks, getAllThemes, toUrlSlug } from '@/lib/bible';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bibel.flogvit.com';
  const books = getAllBooks();
  const themes = getAllThemes();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/om`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/sok`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/kjente-vers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/favoritter`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/temaer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Theme pages
  const themePages: MetadataRoute.Sitemap = themes.map(theme => ({
    url: `${baseUrl}/temaer/${encodeURIComponent(theme.name)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // Bible chapter pages
  const chapterPages: MetadataRoute.Sitemap = [];
  for (const book of books) {
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      chapterPages.push({
        url: `${baseUrl}/${toUrlSlug(book.short_name)}/${chapter}`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.8,
      });
    }
  }

  return [...staticPages, ...themePages, ...chapterPages];
}
