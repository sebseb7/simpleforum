import DOMPurify from 'dompurify';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
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
  ALLOWED_ATTR: [
    'href',
    'rel',
    'target',
    'src',
    'alt',
    'width',
    'height',
    'style',
    'class',
    'data-list',
    'data-forum-placeholder',
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target', 'data-forum-placeholder'],
};

/** Defense-in-depth sanitize before rendering forum HTML as React nodes. */
export function sanitizeForDisplay(html) {
  if (!html) return '';
  const raw = String(html);
  // SSG/Node: body was already sanitized on write; DOMPurify needs a DOM.
  if (typeof window === 'undefined') return raw;
  return DOMPurify.sanitize(raw, PURIFY_CONFIG);
}
