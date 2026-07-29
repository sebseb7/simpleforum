import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { SSG_LANG } from '../../../shared/ssgLang.js';
import { loadPageData, listPrerenderPaths } from './loadPageData.js';
import { materializeOgImage } from './pageMeta.js';
import { jsonLdScriptTag, jsonLdTopic } from './jsonLd.js';
import { writeSitemap } from './sitemap.js';
import { materializeStateBodyImages } from './materializeBodyImages.js';
import { createLogger } from '../logger.js';

const log = createLogger('ssg');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlToFilePath(distDir, urlPath) {
  const clean = String(urlPath || '/').split('?')[0].replace(/\/+$/, '') || '';
  if (!clean || clean === '/') {
    return path.join(distDir, 'index.html');
  }
  return path.join(distDir, clean.replace(/^\//, ''), 'index.html');
}

/**
 * Write Emotion critical CSS to a content-hashed file under dist/ssg-css/.
 * Identical CSS across pages shares one file.
 * @returns {string | null} public href e.g. `/ssg-css/ab12cd.css`
 */
function materializeEmotionCss(distDir, cssText) {
  const css = String(cssText || '').trim();
  if (!css) return null;
  const hash = crypto.createHash('sha256').update(css).digest('hex').slice(0, 12);
  const relDir = 'ssg-css';
  const fileName = `${hash}.css`;
  const abs = path.join(distDir, relDir, fileName);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (!fs.existsSync(abs)) {
    fs.writeFileSync(abs, `${css}\n`, 'utf8');
  }
  return `/${relDir}/${fileName}`;
}

function injectHtml(template, { appHtml, emotionCssHref, preloadedState, meta, lang, jsonLd }) {
  let html = template;

  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const htmlLang = lang || SSG_LANG;
  const ogType = escapeHtml(meta.type || 'website');
  const ogUrl = escapeHtml(meta.url || '');
  const ogImage = escapeHtml(meta.image || '');
  const siteName = escapeHtml(meta.siteName || 'QuixPOS Forum');
  const twitterCard = ogImage ? 'summary_large_image' : 'summary';

  html = html.replace(/<html\b[^>]*>/i, `<html lang="${escapeHtml(htmlLang)}">`);
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);

  const metaTags = [];
  if (emotionCssHref) {
    metaTags.push(
      `<link rel="stylesheet" href="${escapeHtml(emotionCssHref)}" />`,
    );
  }
  metaTags.push(
    `<meta name="description" content="${description}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:site_name" content="${siteName}" />`,
  );
  if (ogUrl) {
    metaTags.push(`<meta property="og:url" content="${ogUrl}" />`);
    metaTags.push(`<link rel="canonical" href="${ogUrl}" />`);
  }
  if (ogImage) {
    metaTags.push(`<meta property="og:image" content="${ogImage}" />`);
    metaTags.push(`<meta name="twitter:image" content="${ogImage}" />`);
  }
  metaTags.push(`<meta name="twitter:card" content="${twitterCard}" />`);
  metaTags.push(`<meta name="twitter:title" content="${title}" />`);
  metaTags.push(`<meta name="twitter:description" content="${description}" />`);
  if (jsonLd) {
    metaTags.push(jsonLdScriptTag(jsonLd));
  }

  // Drop SPA placeholder meta that vite's index.html ships with.
  html = html.replace(
    /<meta\s+name="description"\s+content="QuixPOS community forum[^"]*"\s*\/>/i,
    '',
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="QuixPOS - Community Discussions"\s*\/>/i,
    '',
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="QuixPOS community forum[^"]*"\s*\/>/i,
    '',
  );
  html = html.replace(/<meta\s+property="og:type"\s+content="website"\s*\/>/i, '');

  const metaBlock = metaTags.join('\n    ');

  if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `    ${metaBlock}\n  </head>`);
  }

  const stateJson = JSON.stringify(preloadedState).replace(/</g, '\\u003c');
  const stateScript = `<script>window.__SSG_LANG__=${JSON.stringify(htmlLang)};window.__PRELOADED_STATE__=${stateJson}</script>`;

  if (!html.includes('<div id="root"></div>')) {
    throw new Error(
      'SSG: client template root is not empty — use dist-ssr/client-template.html (run npm run build:client first)',
    );
  }
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>\n    ${stateScript}`,
  );

  return html;
}

function resolveClientTemplate(root, distDir, templatePath) {
  const candidates = [
    path.join(root, 'dist-ssr', 'client-template.html'),
    path.join(distDir, 'index.shell.html'),
    templatePath,
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const html = fs.readFileSync(candidate, 'utf8');
    if (html.includes('<div id="root"></div>')) {
      return { html, path: candidate };
    }
  }
  throw new Error(
    'SSG: no clean client shell template found. Run `npm run build:client` (saves dist-ssr/client-template.html).',
  );
}

/**
 * Full SSG pass: render every public slug into dist/.
 * @param {object} dbStore openDatabase() result
 * @param {{ distDir?: string, ssrEntry?: string, templatePath?: string }} [opts]
 */
export async function prerenderAll(dbStore, opts = {}) {
  const root = opts.rootDir || process.cwd();
  const distDir = opts.distDir || path.join(root, 'dist');
  const ssrEntry =
    opts.ssrEntry || path.join(root, 'dist-ssr', 'entry-server.js');
  const templatePath = opts.templatePath || path.join(distDir, 'index.html');

  if (!fs.existsSync(ssrEntry)) {
    throw new Error(`SSG: missing SSR bundle at ${ssrEntry}`);
  }

  const { html: template, path: templateUsed } = resolveClientTemplate(
    root,
    distDir,
    templatePath,
  );
  // Keep a durable shell so `npm run ssg` works after home overwrites dist/index.html.
  const shellOut = path.join(root, 'dist-ssr', 'client-template.html');
  if (templateUsed !== shellOut) {
    fs.mkdirSync(path.dirname(shellOut), { recursive: true });
    fs.writeFileSync(shellOut, template);
  }
  const mod = await import(pathToFileURL(ssrEntry).href);
  const render = mod.render || mod.default?.render;
  if (typeof render !== 'function') {
    throw new Error('SSG: entry-server must export render()');
  }

  const paths = listPrerenderPaths(dbStore);
  const written = [];
  const ssgCssDir = path.join(distDir, 'ssg-css');
  fs.rmSync(ssgCssDir, { recursive: true, force: true });
  fs.rmSync(path.join(distDir, 'media'), { recursive: true, force: true });

  log.info(`prerender start (${paths.length} paths, lang=${SSG_LANG})`);

  for (const urlPath of paths) {
    const t0 = Date.now();
    const { preloadedState, meta, notFound, ogImageSource, ogAssetKey, jsonLd } =
      loadPageData(dbStore, urlPath);
    if (notFound) {
      log.warn(`${urlPath}  skip=not-found`);
      continue;
    }

    const hadOg = Boolean(ogImageSource);
    if (ogImageSource) {
      meta.image = materializeOgImage(distDir, ogAssetKey || 'image', ogImageSource);
    }

    // Extract data: images from bodies into /media/*.avif before SSR so HTML stays small.
    const mediaCount = await materializeStateBodyImages(distDir, preloadedState);
    const images = mediaCount > 0 || hadOg ? 'yes' : 'no';

    // Rebuild topic JSON-LD after image materialization so `image` is always present.
    let finalJsonLd = jsonLd;
    if (meta.type === 'article' && preloadedState?.topics?.current) {
      finalJsonLd = jsonLdTopic({
        meta,
        topic: preloadedState.topics.current,
      });
    }

    const { html: appHtml, emotionCss } = await render(
      urlPath,
      preloadedState,
      SSG_LANG,
    );
    const emotionCssHref = materializeEmotionCss(distDir, emotionCss);
    const page = injectHtml(template, {
      appHtml,
      emotionCssHref,
      preloadedState,
      meta,
      lang: SSG_LANG,
      jsonLd: finalJsonLd,
    });
    const outFile = urlToFilePath(distDir, urlPath);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, page, 'utf8');
    written.push(urlPath);

    const kb = (Buffer.byteLength(page, 'utf8') / 1024).toFixed(1);
    log.info(
      `${urlPath}  images=${images}  media=${mediaCount}  og=${hadOg ? 'yes' : 'no'}  ${kb}kb  ${Date.now() - t0}ms`,
    );
  }

  const sitemapCount = writeSitemap(dbStore, distDir);
  log.info(
    `prerendered ${written.length} paths (${SSG_LANG}), sitemap ${sitemapCount} urls → ${distDir}`,
  );
  return written;
}
