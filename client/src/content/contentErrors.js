import { CONTENT_LIMITS } from '@shared/contentLimits.js';

/**
 * Map API / client content error codes to i18n strings.
 * @param {unknown} err
 * @param {(key: string, opts?: object) => string} t
 */
export function contentErrorMessage(err, t) {
  const code = err?.data?.error || err?.message;
  const key = `contentFilter.errors.${code}`;
  const translated = t(key, {
    max: err?.data?.max,
    got: err?.data?.got,
    defaultValue: '',
  });
  if (translated) return translated;
  return err?.message || t('contentFilter.errors.generic');
}

export function isOverTitleLimit(title) {
  return String(title || '').trim().length > CONTENT_LIMITS.titleMax;
}

export function isOverBodyLimit(bodyHtml) {
  return new TextEncoder().encode(String(bodyHtml || '')).length > CONTENT_LIMITS.bodyHtmlMax;
}

export { CONTENT_LIMITS };
