import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { CONTENT_LIMITS } from '../../../shared/contentLimits.js';

const DATA_IMG_RE =
  /(<img\b[^>]*\bsrc\s*=\s*)(["'])(data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+)\2/gi;

/**
 * @param {string} dataUrl
 * @returns {{ mime: string, buffer: Buffer } | null}
 */
export function parseDataImageUrl(dataUrl) {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(
    String(dataUrl || '').trim(),
  );
  if (!m) return null;
  let mime = m[1].toLowerCase();
  if (mime === 'image/jpg') mime = 'image/jpeg';
  if (!CONTENT_LIMITS.allowedImageMimes.includes(mime)) return null;
  try {
    const buffer = Buffer.from(m[2].replace(/\s+/g, ''), 'base64');
    if (!buffer.length || buffer.length > CONTENT_LIMITS.maxImageBytes * 2) {
      return null;
    }
    return { mime, buffer };
  } catch {
    return null;
  }
}

/**
 * Encode buffer as AVIF; fall back to original bytes + ext on failure.
 * @returns {Promise<{ bytes: Buffer, ext: string }>}
 */
async function encodeAvifOrFallback(buffer, mime) {
  try {
    const bytes = await sharp(buffer, { animated: false })
      .rotate()
      .avif({ quality: 55, effort: 4 })
      .toBuffer();
    if (bytes?.length) return { bytes, ext: 'avif' };
  } catch {
    // fall through
  }
  const ext =
    mime === 'image/jpeg'
      ? 'jpg'
      : mime === 'image/webp'
        ? 'webp'
        : mime === 'image/gif'
          ? 'gif'
          : 'png';
  return { bytes: buffer, ext };
}

/**
 * Write image under dist/media/<hash>.avif (content-addressed).
 * @returns {Promise<string | null>} public path e.g. `/media/ab12.avif`
 */
export async function materializeDataImage(distDir, dataUrl) {
  const parsed = parseDataImageUrl(dataUrl);
  if (!parsed) return null;

  const hash = crypto
    .createHash('sha256')
    .update(parsed.buffer)
    .digest('hex')
    .slice(0, 16);
  const { bytes, ext } = await encodeAvifOrFallback(parsed.buffer, parsed.mime);
  const fileName = `${hash}.${ext}`;
  const abs = path.join(distDir, 'media', fileName);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (!fs.existsSync(abs)) {
    fs.writeFileSync(abs, bytes);
  }
  return `/media/${fileName}`;
}

/**
 * Replace every data: image in HTML with a public `/media/*.avif` (or fallback) URL.
 */
export async function materializeDataImagesInHtml(distDir, html) {
  const input = String(html || '');
  if (!input.includes('data:image/')) return input;

  DATA_IMG_RE.lastIndex = 0;
  const found = new Map();
  let m;
  while ((m = DATA_IMG_RE.exec(input)) !== null) {
    const dataUrl = m[3];
    if (!found.has(dataUrl)) found.set(dataUrl, null);
  }
  if (!found.size) return input;

  for (const dataUrl of found.keys()) {
    found.set(dataUrl, await materializeDataImage(distDir, dataUrl));
  }

  DATA_IMG_RE.lastIndex = 0;
  return input.replace(DATA_IMG_RE, (full, prefix, quote, dataUrl) => {
    const href = found.get(dataUrl);
    if (!href) return full;
    return `${prefix}${quote}${href}${quote}`;
  });
}

/**
 * Rewrite bodyHtml data: images in SSG preloaded Redux state (in place).
 */
export async function materializeStateBodyImages(distDir, preloadedState) {
  if (!preloadedState) return;

  const topic = preloadedState.topics?.current;
  if (topic?.bodyHtml) {
    topic.bodyHtml = await materializeDataImagesInHtml(distDir, topic.bodyHtml);
  }

  const byTopic = preloadedState.posts?.byTopicId || {};
  for (const posts of Object.values(byTopic)) {
    if (!Array.isArray(posts)) continue;
    for (const post of posts) {
      if (post?.bodyHtml) {
        post.bodyHtml = await materializeDataImagesInHtml(
          distDir,
          post.bodyHtml,
        );
      }
    }
  }
}
