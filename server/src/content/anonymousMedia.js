/**
 * Anonymous viewers may see links/images for content inside admin-only
 * sections (announcements). Everywhere else, media is redacted until sign-in.
 */
export function shouldRedactAnonymousMedia(row, viewerAuthed) {
  if (viewerAuthed) return false;
  if (row?.section_admin_only_topics) return false;
  return true;
}
