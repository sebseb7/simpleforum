/** Map common Latin letters (incl. German) to ASCII for URL slugs. */
const CHAR_MAP = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  Ä: 'ae',
  Ö: 'oe',
  Ü: 'ue',
  ß: 'ss',
  à: 'a',
  á: 'a',
  â: 'a',
  ã: 'a',
  å: 'a',
  æ: 'ae',
  ç: 'c',
  è: 'e',
  é: 'e',
  ê: 'e',
  ë: 'e',
  ì: 'i',
  í: 'i',
  î: 'i',
  ï: 'i',
  ñ: 'n',
  ò: 'o',
  ó: 'o',
  ô: 'o',
  õ: 'o',
  ø: 'o',
  ù: 'u',
  ú: 'u',
  û: 'u',
  ý: 'y',
  ÿ: 'y',
};

/**
 * Derive a URL-safe slug from a title/name.
 * @param {string} text
 * @param {number} [maxLen=80]
 * @returns {string}
 */
export function slugify(text, maxLen = 80) {
  const mapped = String(text || '')
    .split('')
    .map((ch) => CHAR_MAP[ch] ?? ch)
    .join('');
  const slug = mapped
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
    .replace(/-+$/g, '');
  return slug || 'item';
}

/**
 * Pick a unique slug; appends -2, -3, … when `exists` returns true.
 * @param {string} text
 * @param {(slug: string) => boolean} exists
 * @param {number} [maxLen=80]
 * @returns {string}
 */
export function uniqueSlug(text, exists, maxLen = 80) {
  const base = slugify(text, maxLen);
  if (!exists(base)) return base;
  for (let i = 2; i < 10_000; i += 1) {
    const suffix = `-${i}`;
    const candidate = `${base.slice(0, Math.max(1, maxLen - suffix.length))}${suffix}`;
    if (!exists(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
