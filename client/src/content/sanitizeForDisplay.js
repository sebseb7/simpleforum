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
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
};

/** Defense-in-depth sanitize before rendering forum HTML as React nodes. */
export function sanitizeForDisplay(html) {
  if (!html) return '';
  return DOMPurify.sanitize(String(html), PURIFY_CONFIG);
}
