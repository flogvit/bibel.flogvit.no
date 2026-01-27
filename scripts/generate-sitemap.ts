import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://bibel.flogvit.com';

interface Book {
  id: number;
  name: string;
  chapters: number;
}

// Convert book name to URL slug
function toUrlSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a');
}

function generateSitemap() {
  const dbPath = path.join(process.cwd(), 'data', 'bible.db');
  const db = new Database(dbPath, { readonly: true });

  // Get all books
  const books = db.prepare('SELECT id, name, chapters FROM books ORDER BY id').all() as Book[];

  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages -->
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/om</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/sok</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/sok/original</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/tidslinje</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/profetier</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/personer</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/temaer</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/leseplan</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/kjente-vers</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/tilgjengelighet</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`;

  // Add all Bible chapters
  for (const book of books) {
    const slug = toUrlSlug(book.name);
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      xml += `  <url>
    <loc>${BASE_URL}/${slug}/${chapter}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
  }

  xml += `</urlset>
`;

  // Write to public folder
  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf-8');

  // Count URLs
  const urlCount = (xml.match(/<url>/g) || []).length;
  console.log(`Sitemap generated: ${outputPath}`);
  console.log(`Total URLs: ${urlCount}`);

  db.close();
}

generateSitemap();
