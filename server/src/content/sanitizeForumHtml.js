import sanitizeHtml from 'sanitize-html';
import { CONTENT_LIMITS } from '../../../shared/contentLimits.js';
import { ContentValidationError } from './errors.js';

const DIRTY_PROBE =
  /<script\b|<\/script|on[a-z]+\s*=|javascript:|vbscript:|data:text\/html|<iframe\b|<object\b|<embed\b|<svg\b|<link\b|<meta\b|<style\b|expression\s*\(/i;

const ALLOWED_IMG_STYLE = {
  width: [/^\d+(?:\.\d+)?(?:px|%)?$/i],
  height: [/^\d+(?:\.\d+)?(?:px|%)?$/i],
  float: [/^(?:left|right|none)$/i],
  display: [/^(?:block|inline|inline-block)$/i],
  'margin-left': [/^\d+(?:\.\d+)?(?:px|%)?$/i],
  'margin-right': [/^\d+(?:\.\d+)?(?:px|%)?$/i],
  'max-width': [/^\d+(?:\.\d+)?(?:px|%)?$/i],
};

function decodedDataUrlBytes(dataUrl) {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return Infinity;
  const header = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  if (!/;base64/i.test(header)) {
    return Buffer.byteLength(decodeURIComponent(payload), 'utf8');
  }
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

function parseDataImageMime(src) {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(src);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  return mime === 'image/jpg' ? 'image/jpeg' : mime;
}

function isAllowedHref(href) {
  if (!href || typeof href !== 'string') return false;
  const trimmed = href.trim();
  if (trimmed.startsWith('#') && !trimmed.startsWith('#javascript')) return true;
  try {
    const url = new URL(trimmed, 'https://example.invalid');
    return ['http:', 'https:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function isAllowedImageSrc(src) {
  if (!src || typeof src !== 'string') return { ok: false, code: 'image_removed' };
  const trimmed = src.trim();
  if (trimmed.startsWith('data:')) {
    const mime = parseDataImageMime(trimmed);
    if (!mime || !CONTENT_LIMITS.allowedImageMimes.includes(mime)) {
      return { ok: false, code: 'image_type_not_allowed' };
    }
    const bytes = decodedDataUrlBytes(trimmed);
    if (bytes > CONTENT_LIMITS.maxImageBytes) {
      return { ok: false, code: 'image_too_large', bytes };
    }
    return { ok: true, kind: 'data', bytes, mime };
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') {
      return { ok: false, code: 'image_removed' };
    }
    return { ok: true, kind: 'https', bytes: 0 };
  } catch {
    return { ok: false, code: 'image_removed' };
  }
}

function plainTextFromHtml(html) {
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

function pushWarning(warnings, code, detail) {
  if (warnings.some((w) => w.code === code && w.detail === detail)) return;
  warnings.push(detail ? { code, detail } : { code });
}

/**
 * Sanitize forum rich-text HTML. Throws ContentValidationError on hard rejects.
 * @returns {{ html: string, contentFilter: { changed: boolean, warnings: object[], stats: object } }}
 */
export function sanitizeForumHtml(raw, { required = false } = {}) {
  const input = raw == null ? '' : String(raw);
  const bytesIn = Buffer.byteLength(input, 'utf8');

  if (bytesIn > CONTENT_LIMITS.bodyHtmlMax) {
    throw new ContentValidationError('body_too_large', {
      max: CONTENT_LIMITS.bodyHtmlMax,
      got: bytesIn,
    });
  }

  const warnings = [];
  if (DIRTY_PROBE.test(input)) {
    pushWarning(warnings, 'html_sanitized');
  }

  let imagesKept = 0;
  let imagesRemoved = 0;
  let totalImageBytes = 0;

  const cleaned = sanitizeHtml(input, {
    allowedTags: [
      'p',
      'br',
      'h1',
      'h2',
      'h3',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'blockquote',
      'ol',
      'ul',
      'li',
      'a',
      'img',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
      img: ['src', 'alt', 'width', 'height', 'style'],
      p: ['class', 'style'],
      h1: ['class', 'style'],
      h2: ['class', 'style'],
      h3: ['class', 'style'],
      span: ['class', 'style'],
      li: ['class', 'data-list'],
      ol: ['class'],
      ul: ['class'],
    },
    allowedClasses: {
      '*': [
        'ql-align-center',
        'ql-align-right',
        'ql-align-justify',
        'ql-align-left',
        /^ql-indent-\d+$/,
      ],
    },
    allowedStyles: {
      '*': {
        'text-align': [/^(?:left|right|center|justify)$/i],
        ...ALLOWED_IMG_STYLE,
      },
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => {
        const href = attribs.href || '';
        if (!isAllowedHref(href)) {
          pushWarning(warnings, 'link_protocol_stripped');
          return { tagName: 'span', attribs: {} };
        }
        return {
          tagName: 'a',
          attribs: {
            href: href.trim(),
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        };
      },
      img: (_tagName, attribs) => {
        const check = isAllowedImageSrc(attribs.src);
        if (!check.ok) {
          imagesRemoved += 1;
          pushWarning(warnings, check.code);
          return { tagName: '', text: '' };
        }
        if (imagesKept >= CONTENT_LIMITS.maxImages) {
          imagesRemoved += 1;
          pushWarning(warnings, 'too_many_images');
          return { tagName: '', text: '' };
        }
        if (
          check.kind === 'data' &&
          totalImageBytes + check.bytes > CONTENT_LIMITS.maxTotalImageBytes
        ) {
          imagesRemoved += 1;
          pushWarning(warnings, 'image_too_large');
          return { tagName: '', text: '' };
        }
        imagesKept += 1;
        if (check.kind === 'data') totalImageBytes += check.bytes;
        const next = {
          src: attribs.src.trim(),
        };
        if (attribs.alt) next.alt = String(attribs.alt).slice(0, 200);
        if (attribs.width) next.width = String(attribs.width).replace(/[^\d.]/g, '');
        if (attribs.height) next.height = String(attribs.height).replace(/[^\d.]/g, '');
        if (attribs.style) next.style = attribs.style;
        return { tagName: 'img', attribs: next };
      },
    },
  });

  // Hard-reject if over image count before soft-removal left a confusing result:
  // soft-remove is fine; only hard-reject raw oversize already handled.

  const text = plainTextFromHtml(cleaned);
  if (text.length > CONTENT_LIMITS.bodyTextMax) {
    throw new ContentValidationError('body_text_too_long', {
      max: CONTENT_LIMITS.bodyTextMax,
      got: text.length,
    });
  }

  const hasImage = /<img\b/i.test(cleaned);
  if (required && !text && !hasImage) {
    const originalText = plainTextFromHtml(input);
    throw new ContentValidationError(
      originalText ? 'empty_after_sanitize' : 'body_required',
    );
  }

  // Catch remaining structural strips (disallowed tags) without dirty probe.
  if (!warnings.length && cleaned.replace(/\s+/g, '') !== input.replace(/\s+/g, '')) {
    // Only flag when tags/attrs clearly differ in a meaningful way (length drop).
    if (cleaned.length < input.length * 0.98 || /<\s*(script|iframe|svg|style)\b/i.test(input)) {
      pushWarning(warnings, 'html_sanitized');
    }
  }

  const bytesOut = Buffer.byteLength(cleaned, 'utf8');
  return {
    html: cleaned,
    contentFilter: {
      changed: warnings.length > 0,
      warnings,
      stats: {
        bytesIn,
        bytesOut,
        imagesKept,
        imagesRemoved,
      },
    },
  };
}
