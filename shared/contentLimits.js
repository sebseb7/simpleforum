/** Shared content size limits (server + client). Keep in sync intentionally. */
export const CONTENT_LIMITS = {
  titleMax: 120,
  sectionTitleMax: 120,
  sectionDescriptionMax: 500,
  /** Max length of bodyHtml string (includes base64 images). */
  bodyHtmlMax: 400_000,
  /** Max plain-text characters after stripping tags. */
  bodyTextMax: 20_000,
  maxImages: 3,
  /** Decoded image byte size (per data: URL). */
  maxImageBytes: 120_000,
  /** Sum of decoded data: image bytes in one body. */
  maxTotalImageBytes: 300_000,
  allowedImageMimes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
};
