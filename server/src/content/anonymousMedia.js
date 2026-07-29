/**
 * Anonymous viewers may see links/images only for admin-authored content
 * inside admin-only sections (announcements). Everyone else is redacted.
 */
export function shouldRedactAnonymousMedia(row, viewerAuthed) {
  if (viewerAuthed) return false;
  if (row?.section_admin_only_topics && row?.author_is_admin) return false;
  return true;
}
