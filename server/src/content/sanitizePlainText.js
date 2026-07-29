import { CONTENT_LIMITS } from '../../../shared/contentLimits.js';
import { ContentValidationError } from './errors.js';

/** Strip tags and control chars; enforce max length. */
export function sanitizePlainText(
  input,
  {
    maxLen = CONTENT_LIMITS.titleMax,
    required = false,
    emptyCode = 'title_required',
    tooLongCode = 'title_too_long',
  } = {},
) {
  let text = String(input ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (required && !text) {
    throw new ContentValidationError(emptyCode);
  }
  if (text.length > maxLen) {
    throw new ContentValidationError(tooLongCode, {
      max: maxLen,
      got: text.length,
    });
  }
  return text;
}
