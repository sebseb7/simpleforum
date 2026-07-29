const LINK_PLACEHOLDER =
  '<span class="forum-anon-placeholder" data-forum-placeholder="link">[link]</span>';
const IMAGE_PLACEHOLDER =
  '<span class="forum-anon-placeholder" data-forum-placeholder="image">[image]</span>';

/**
 * Replace anchors and images so anonymous viewers never receive real URLs.
 * Idempotent on already-redacted HTML.
 */
export function redactAnonymousHtml(html) {
  if (!html) return html;
  let out = String(html);
  out = out.replace(/<img\b[^>]*>/gi, IMAGE_PLACEHOLDER);
  out = out.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, LINK_PLACEHOLDER);
  return out;
}
