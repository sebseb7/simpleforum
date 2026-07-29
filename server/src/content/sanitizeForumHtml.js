import sanitizeHtml from 'sanitize-html';
import { CONTENT_LIMITS } from '../../../shared/contentLimits.js';
import { ContentValidationError } from './errors.js';
import { createLogger } from '../logger.js';

const log = createLogger('content-filter');

// Named probes so warnings can say exactly what triggered them.
const DIRTY_PROBES = [
  { id: 'script', re: /<script\b|<\/script\b/i },
  { id: 'iframe', re: /<iframe\b/i },
  { id: 'object', re: /<object\b/i },
  { id: 'embed', re: /<embed\b/i },
  { id: 'svg', re: /<svg\b/i },
  { id: 'link_tag', re: /<link\b/i },
  { id: 'meta', re: /<meta\b/i },
  { id: 'style_tag', re: /<style\b/i },
  { id: 'javascript_url', re: /javascript:/i },
  { id: 'vbscript_url', re: /vbscript:/i },
  { id: 'data_html', re: /data:text\/html/i },
  { id: 'css_expression', re: /expression\s*\(/i },
  // Event handlers only inside tags (not prose like "content=" / "once =").
  { id: 'event_handler', re: /<[^>]*\s+on[a-z]+\s*=/i },
];

const LENGTH_OR_AUTO = /^(?:auto|\d+(?:\.\d+)?(?:px|%)?)$/i;
const MARGIN_SHORTHAND =
  /^(?:auto|\d+(?:\.\d+)?(?:px|%)?)(?:\s+(?:auto|\d+(?:\.\d+)?(?:px|%)?)){0,3}$/i;

const ALLOWED_IMG_STYLE = {
  width: [/^\d+(?:\.\d+)?(?:px|%)?$/i],
  height: [/^\d+(?:\.\d+)?(?:px|%)?$/i],
  float: [/^(?:left|right|none)$/i],
  display: [/^(?:block|inline|inline-block)$/i],
  margin: [MARGIN_SHORTHAND],
  'margin-top': [LENGTH_OR_AUTO],
  'margin-right': [LENGTH_OR_AUTO],
  'margin-bottom': [LENGTH_OR_AUTO],
  'margin-left': [LENGTH_OR_AUTO],
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

function snippetAround(html, index, radius = 48) {
  const start = Math.max(0, index - radius);
  const end = Math.min(html.length, index + radius);
  let snip = html.slice(start, end).replace(/\s+/g, ' ');
  if (start > 0) snip = `…${snip}`;
  if (end < html.length) snip = `${snip}…`;
  return snip;
}

function findDirtyHits(input) {
  const hits = [];
  for (const probe of DIRTY_PROBES) {
    const m = probe.re.exec(input);
    if (!m) continue;
    hits.push({
      id: probe.id,
      match: m[0].slice(0, 80),
      snippet: snippetAround(input, m.index),
    });
  }
  return hits;
}

function summarizeHtmlDiff(before, after) {
  const forCompare = (s) =>
    String(s || '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#160;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, ' ')
      .trim();
  const a = forCompare(before);
  const b = forCompare(after);
  if (a === b) return null;
  const countTags = (html) => {
    const counts = Object.create(null);
    let m;
    const re = /<\/?([a-z0-9]+)(\s[^>]*)?>/gi;
    while ((m = re.exec(html))) {
      const name = m[1].toLowerCase();
      counts[name] = (counts[name] || 0) + 1;
    }
    return counts;
  };
  const beforeTags = countTags(before);
  const afterTags = countTags(after);
  const removedTags = [];
  const addedTags = [];
  for (const name of new Set([...Object.keys(beforeTags), ...Object.keys(afterTags)])) {
    const d = (afterTags[name] || 0) - (beforeTags[name] || 0);
    if (d < 0) removedTags.push(`${name}×${-d}`);
    if (d > 0) addedTags.push(`${name}×${d}`);
  }
  return {
    bytesIn: Buffer.byteLength(before, 'utf8'),
    bytesOut: Buffer.byteLength(after, 'utf8'),
    removedTags,
    addedTags,
    beforeSnippet: a.slice(0, 160) + (a.length > 160 ? '…' : ''),
    afterSnippet: b.slice(0, 160) + (b.length > 160 ? '…' : ''),
  };
}

function warningKey(w) {
  return `${w.code}::${typeof w.detail === 'string' ? w.detail : JSON.stringify(w.detail || '')}`;
}

function pushWarning(warnings, code, detail) {
  const entry = detail ? { code, detail } : { code };
  if (warnings.some((w) => warningKey(w) === warningKey(entry))) return;
  warnings.push(entry);
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
  const dirtyHits = findDirtyHits(input);
  for (const hit of dirtyHits) {
    pushWarning(warnings, 'html_sanitized', {
      reason: hit.id,
      match: hit.match,
      snippet: hit.snippet,
    });
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
          pushWarning(warnings, 'link_protocol_stripped', {
            href: String(href).slice(0, 120),
          });
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
          pushWarning(warnings, check.code, {
            src: String(attribs.src || '').slice(0, 80),
          });
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

  const diff = summarizeHtmlDiff(input, cleaned);
  // Only warn on real structural strips (disallowed tags), not Quill &nbsp; / whitespace
  // normalization — those used to fire a scary "markup removed" for harmless text.
  if (
    diff &&
    !warnings.some((w) => w.code === 'html_sanitized') &&
    diff.removedTags.length > 0
  ) {
    pushWarning(warnings, 'html_sanitized', {
      reason: 'structural_diff',
      ...diff,
    });
  }

  const bytesOut = Buffer.byteLength(cleaned, 'utf8');
  const contentFilter = {
    changed: warnings.length > 0,
    warnings,
    stats: {
      bytesIn,
      bytesOut,
      imagesKept,
      imagesRemoved,
    },
  };

  if (contentFilter.changed) {
    log.warn('sanitize changed content', {
      warnings,
      stats: contentFilter.stats,
      dirtyHits,
      diff,
    });
  }

  return { html: cleaned, contentFilter };
}
