import fs from 'fs';
import path from 'path';
import { shouldRedactAnonymousMedia } from '../content/anonymousMedia.js';
import { CONTENT_LIMITS } from '../../../shared/contentLimits.js';

const IMG_SRC_RE = /<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi;

const MIME_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/**
 * Absolute site origin for og:url / absolute asset links.
 * Prefer CLIENT_ORIGIN (public nginx origin).
 */
export function siteOrigin() {
  const raw = String(process.env.CLIENT_ORIGIN || '').trim().replace(/\/+$/, '');
  if (raw) return raw;
  return 'https://forum.quixpos.com';
}

export function plainTextFromHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * First public image in HTML for OG: https URL or data: payload.
 * @returns {{ kind: 'https', url: string } | { kind: 'data', mime: string, buffer: Buffer } | null}
 */
export function firstPublicImageSource(html) {
  if (!html) return null;
  IMG_SRC_RE.lastIndex = 0;
  let m;
  while ((m = IMG_SRC_RE.exec(html)) !== null) {
    const src = String(m[2] || '').trim();
    if (/^https:\/\//i.test(src)) {
      return { kind: 'https', url: src };
    }
    const data = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(src);
    if (!data) continue;
    let mime = data[1].toLowerCase();
    if (mime === 'image/jpg') mime = 'image/jpeg';
    if (!CONTENT_LIMITS.allowedImageMimes.includes(mime)) continue;
    try {
      const buffer = Buffer.from(data[2].replace(/\s+/g, ''), 'base64');
      if (!buffer.length || buffer.length > CONTENT_LIMITS.maxImageBytes * 2) {
        // Allow a bit of headroom vs post limit; skip absurd payloads.
        continue;
      }
      return { kind: 'data', mime, buffer };
    } catch {
      continue;
    }
  }
  return null;
}

/** @deprecated Prefer firstPublicImageSource */
export function firstHttpsImage(html) {
  const src = firstPublicImageSource(html);
  return src?.kind === 'https' ? src.url : '';
}

/**
 * Image source visible to anonymous visitors (admin posts in admin-only sections).
 */
export function publicOgImageSourceFromRow(row) {
  if (!row) return null;
  if (shouldRedactAnonymousMedia(row, false)) return null;
  return firstPublicImageSource(row.body_html);
}

/** @deprecated Prefer publicOgImageSourceFromRow + resolve */
export function publicOgImageFromRow(row) {
  const src = publicOgImageSourceFromRow(row);
  return src?.kind === 'https' ? src.url : '';
}

/**
 * Build description from topic + reply posts (plain text, capped).
 */
export function buildTopicDescription(topicHtml, postHtmls, maxLen = 300) {
  const parts = [];
  const topicText = plainTextFromHtml(topicHtml);
  if (topicText) parts.push(topicText);
  for (const html of postHtmls || []) {
    const t = plainTextFromHtml(html);
    if (t) parts.push(t);
    if (parts.join(' ').length >= maxLen) break;
  }
  return parts.join(' — ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

/**
 * First public OG image source from topic body, then posts (raw DB rows).
 */
export function buildTopicOgImageSource(topicRow, postRows) {
  const fromTopic = publicOgImageSourceFromRow(topicRow);
  if (fromTopic) return fromTopic;
  for (const row of postRows || []) {
    const img = publicOgImageSourceFromRow(row);
    if (img) return img;
  }
  return null;
}

/** @deprecated Prefer buildTopicOgImageSource + materializeOgImage */
export function buildTopicOgImage(topicRow, postRows) {
  const src = buildTopicOgImageSource(topicRow, postRows);
  return src?.kind === 'https' ? src.url : '';
}

/**
 * Write a data: OG image into dist/og/ and return the absolute public URL.
 * HTTPS sources are returned unchanged.
 *
 * @param {string} distDir
 * @param {string} assetKey safe filename stem (e.g. topic slug)
 * @param {{ kind: string, url?: string, mime?: string, buffer?: Buffer } | null} source
 */
export function materializeOgImage(distDir, assetKey, source) {
  if (!source) return '';
  if (source.kind === 'https') return source.url || '';
  if (source.kind !== 'data' || !source.buffer?.length) return '';

  const ext = MIME_EXT[source.mime] || 'png';
  const safe = String(assetKey || 'image')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'image';
  const rel = path.posix.join('og', `${safe}.${ext}`);
  const outFile = path.join(distDir, 'og', `${safe}.${ext}`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, source.buffer);
  return `${siteOrigin()}/${rel}`;
}

/**
 * Absolute canonical URL for a path.
 */
export function canonicalUrl(pathName) {
  const origin = siteOrigin();
  const p = pathName.startsWith('/') ? pathName : `/${pathName}`;
  return `${origin}${p}`;
}
