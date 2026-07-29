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
 * effort 1 ≈ much faster than default 4; quality still fine for forum images.
 * @returns {Promise<{ bytes: Buffer, ext: string }>}
 */
async function encodeAvifOrFallback(buffer, mime) {
  try {
    const bytes = await sharp(buffer, { animated: false })
      .rotate()
      .avif({ quality: 50, effort: 1 })
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
 * Skips re-encoding when the hashed file already exists from a prior SSG pass.
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
  const mediaDir = path.join(distDir, 'media');
  fs.mkdirSync(mediaDir, { recursive: true });

  const cachedExts = ['avif', 'jpg', 'webp', 'png', 'gif'];
  for (const ext of cachedExts) {
    const name = `${hash}.${ext}`;
    if (fs.existsSync(path.join(mediaDir, name))) {
      return `/media/${name}`;
    }
  }

  const { bytes, ext } = await encodeAvifOrFallback(parsed.buffer, parsed.mime);
  const fileName = `${hash}.${ext}`;
  fs.writeFileSync(path.join(mediaDir, fileName), bytes);
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
 * @returns {Promise<number>} number of data: images replaced
 */
export async function materializeStateBodyImages(distDir, preloadedState) {
  if (!preloadedState) return 0;

  let count = 0;

  // Only topic detail + posts — section topic lists omit bodyHtml in SSG.

  const topic = preloadedState.topics?.current;
  if (topic?.bodyHtml) {
    const before = topic.bodyHtml;
    topic.bodyHtml = await materializeDataImagesInHtml(distDir, topic.bodyHtml);
    count += countMaterialized(before, topic.bodyHtml);
  }

  const byTopic = preloadedState.posts?.byTopicId || {};
  for (const posts of Object.values(byTopic)) {
    if (!Array.isArray(posts)) continue;
    for (const post of posts) {
      if (!post?.bodyHtml) continue;
      const before = post.bodyHtml;
      post.bodyHtml = await materializeDataImagesInHtml(distDir, post.bodyHtml);
      count += countMaterialized(before, post.bodyHtml);
    }
  }
  return count;
}

function countMaterialized(before, after) {
  if (before === after) return 0;
  const re = /data:image\//gi;
  const a = before.match(re)?.length || 0;
  const b = after.match(re)?.length || 0;
  return Math.max(0, a - b);
}
