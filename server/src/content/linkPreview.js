const FETCH_TIMEOUT_MS = 6_000;
const MAX_HTML_BYTES = 512_000;
const MAX_REDIRECTS = 5;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 200;
const USER_AGENT =
  'Mozilla/5.0 (compatible; QuixPOSLinkPreview/1.0; +https://localhost) AppleWebKit/537.36';

const PRIVATE_HOST =
  /^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i;
const BLOCKED_IPV4 =
  /^(0\.|10\.|127\.|169\.254\.|192\.168\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|172\.(1[6-9]|2\d|3[01])\.)/;

/** @type {Map<string, { expires: number, value: object }>} */
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
}

function decodeEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .trim();
}

function metaContent(html, keys) {
  for (const key of keys) {
    const propRe = new RegExp(
      `<meta\\b[^>]*(?:property|name)\\s*=\\s*["']${key}["'][^>]*\\bcontent\\s*=\\s*["']([^"']*)["'][^>]*>`,
      'i',
    );
    const contentFirst = new RegExp(
      `<meta\\b[^>]*\\bcontent\\s*=\\s*["']([^"']*)["'][^>]*(?:property|name)\\s*=\\s*["']${key}["'][^>]*>`,
      'i',
    );
    const m = html.match(propRe) || html.match(contentFirst);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return '';
}

function documentTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? decodeEntities(m[1]) : '';
}

function faviconHref(html, baseUrl) {
  const linkRe =
    /<link\b[^>]*\brel\s*=\s*["']([^"']*)["'][^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const linkReAlt =
    /<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*\brel\s*=\s*["']([^"']*)["'][^>]*>/gi;
  const candidates = [];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rel = m[1].toLowerCase();
    if (/\bicon\b/.test(rel) || rel.includes('apple-touch-icon')) {
      candidates.push(m[2]);
    }
  }
  while ((m = linkReAlt.exec(html)) !== null) {
    const rel = m[2].toLowerCase();
    if (/\bicon\b/.test(rel) || rel.includes('apple-touch-icon')) {
      candidates.push(m[1]);
    }
  }
  const href = candidates[0];
  if (!href) {
    try {
      return new URL('/favicon.ico', baseUrl).href;
    } catch {
      return '';
    }
  }
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return '';
  }
}

function absolutize(maybeUrl, baseUrl) {
  if (!maybeUrl) return '';
  try {
    const u = new URL(maybeUrl, baseUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.href;
  } catch {
    return '';
  }
}

/**
 * Reject SSRF-prone targets (literal private IPs / local hostnames).
 * @param {string} href
 * @returns {URL}
 */
export function assertSafePreviewUrl(href) {
  let url;
  try {
    url = new URL(String(href || '').trim());
  } catch {
    throw Object.assign(new Error('invalid_url'), { code: 'invalid_url' });
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw Object.assign(new Error('invalid_url'), { code: 'invalid_url' });
  }
  if (url.username || url.password) {
    throw Object.assign(new Error('invalid_url'), { code: 'invalid_url' });
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (PRIVATE_HOST.test(host)) {
    throw Object.assign(new Error('blocked_host'), { code: 'blocked_host' });
  }
  // IPv6 localhost / ULA / link-local
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
    throw Object.assign(new Error('blocked_host'), { code: 'blocked_host' });
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) && BLOCKED_IPV4.test(host)) {
    throw Object.assign(new Error('blocked_host'), { code: 'blocked_host' });
  }
  return url;
}

async function readBodyLimited(res, maxBytes) {
  if (!res.body || typeof res.body.getReader !== 'function') {
    const text = await res.text();
    return text.slice(0, maxBytes);
  }
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      chunks.push(value.slice(0, Math.max(0, value.byteLength - (size - maxBytes))));
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
}

async function fetchHtml(startUrl) {
  let current = startUrl.href;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    assertSafePreviewUrl(current);
    const res = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en,de;q=0.8',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      if (!loc) {
        throw Object.assign(new Error('fetch_failed'), { code: 'fetch_failed' });
      }
      current = new URL(loc, current).href;
      continue;
    }

    if (!res.ok) {
      throw Object.assign(new Error('fetch_failed'), { code: 'fetch_failed', status: res.status });
    }

    const ctype = (res.headers.get('content-type') || '').toLowerCase();
    if (ctype && !ctype.includes('html') && !ctype.includes('xml') && !ctype.includes('text/plain')) {
      // Still allow empty/odd types; many sites omit or mislabel.
      if (ctype.startsWith('image/') || ctype.startsWith('video/') || ctype.startsWith('audio/')) {
        throw Object.assign(new Error('not_html'), { code: 'not_html' });
      }
    }

    const html = await readBodyLimited(res, MAX_HTML_BYTES);
    return { html, finalUrl: current };
  }
  throw Object.assign(new Error('fetch_failed'), { code: 'fetch_failed' });
}

/**
 * Parse OG / Twitter / title / favicon from HTML.
 * @param {string} html
 * @param {string} pageUrl
 */
export function parseLinkPreviewHtml(html, pageUrl) {
  const title =
    metaContent(html, ['og:title', 'twitter:title']) || documentTitle(html) || '';
  const description =
    metaContent(html, ['og:description', 'twitter:description', 'description']) || '';
  const image = absolutize(
    metaContent(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']),
    pageUrl,
  );
  const siteName = metaContent(html, ['og:site_name']) || '';
  const favicon = faviconHref(html, pageUrl);
  let host = '';
  try {
    host = new URL(pageUrl).hostname;
  } catch {
    host = '';
  }
  return {
    url: pageUrl,
    title: (title || host || pageUrl).slice(0, 300),
    description: description.slice(0, 500),
    image,
    favicon,
    siteName: siteName.slice(0, 120),
  };
}

function fallbackPreview(url) {
  let host = url.hostname;
  let favicon = '';
  try {
    favicon = new URL('/favicon.ico', url.origin).href;
  } catch {
    favicon = '';
  }
  return {
    url: url.href,
    title: host,
    description: '',
    image: '',
    favicon,
    siteName: host,
  };
}

/**
 * Fetch remote page and build a link-preview payload (cached).
 * On fetch failure returns hostname + favicon fallback.
 * @param {string} href
 */
export async function getLinkPreview(href) {
  const url = assertSafePreviewUrl(href);
  url.hash = '';
  const cacheKey = url.href;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const { html, finalUrl } = await fetchHtml(url);
    const preview = parseLinkPreviewHtml(html, finalUrl);
    if (!preview.title) preview.title = url.hostname;
    if (!preview.favicon) {
      try {
        preview.favicon = new URL('/favicon.ico', finalUrl).href;
      } catch {
        /* ignore */
      }
    }
    cacheSet(cacheKey, preview);
    return preview;
  } catch (err) {
    if (err?.code === 'invalid_url' || err?.code === 'blocked_host') throw err;
    const preview = fallbackPreview(url);
    // Cache soft failures briefly to avoid hammering bad hosts.
    cacheSet(cacheKey, preview);
    return preview;
  }
}

/** @internal test helper */
export function _clearLinkPreviewCache() {
  cache.clear();
}
