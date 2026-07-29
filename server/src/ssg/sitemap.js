import fs from 'fs';
import path from 'path';
import { canonicalUrl, siteOrigin } from './pageMeta.js';
import { listPrerenderPaths } from './loadPageData.js';

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Write sitemap.xml (+ robots.txt) for all public prerender paths.
 * @param {object} dbStore
 * @param {string} distDir
 */
export function writeSitemap(dbStore, distDir) {
  const paths = listPrerenderPaths(dbStore);
  const now = new Date().toISOString();

  const urls = paths.map((p) => {
    const loc = canonicalUrl(p === '/' ? '/' : p);
    let priority = '0.5';
    let changefreq = 'weekly';
    if (p === '/') {
      priority = '1.0';
      changefreq = 'daily';
    } else if (p.startsWith('/section/')) {
      priority = '0.8';
      changefreq = 'daily';
    } else if (p.startsWith('/topic/')) {
      priority = '0.7';
      changefreq = 'daily';
    } else if (p === '/privacy') {
      priority = '0.3';
      changefreq = 'yearly';
    }
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8');

  const robots = `User-agent: *
Allow: /

Sitemap: ${siteOrigin()}/sitemap.xml
`;
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots, 'utf8');

  return paths.length;
}
