/**
 * Unique http(s) hrefs from forum HTML (Quill anchors), in document order.
 * @param {string} html
 * @param {{ max?: number }} [opts]
 * @returns {string[]}
 */
export function extractLinkUrls(html, { max = 8 } = {}) {
  if (!html || typeof html !== 'string') return [];
  const seen = new Set();
  const out = [];
  const re = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[2].trim();
    let href;
    try {
      const u = new URL(raw);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
      // Normalize: drop hash for dedupe; keep search.
      u.hash = '';
      href = u.href;
    } catch {
      continue;
    }
    if (seen.has(href)) continue;
    seen.add(href);
    out.push(href);
    if (out.length >= max) break;
  }
  return out;
}
