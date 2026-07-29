import { CONTENT_LIMITS } from '../../../shared/contentLimits.js';
import { sanitizeForumHtml } from './sanitizeForumHtml.js';
import { sanitizePlainText } from './sanitizePlainText.js';

export function validateTopicInput({ title, bodyHtml }) {
  const cleanTitle = sanitizePlainText(title, {
    maxLen: CONTENT_LIMITS.titleMax,
    required: true,
    emptyCode: 'title_required',
    tooLongCode: 'title_too_long',
  });
  const { html, contentFilter } = sanitizeForumHtml(bodyHtml ?? '', {
    required: false,
  });
  return { title: cleanTitle, bodyHtml: html, contentFilter };
}

export function validatePostInput({ bodyHtml }) {
  const { html, contentFilter } = sanitizeForumHtml(bodyHtml ?? '', {
    required: true,
  });
  return { bodyHtml: html, contentFilter };
}

export function validateSectionInput({ title, description }) {
  const cleanTitle = sanitizePlainText(title, {
    maxLen: CONTENT_LIMITS.sectionTitleMax,
    required: true,
    emptyCode: 'title_required',
    tooLongCode: 'title_too_long',
  });
  const cleanDescription = sanitizePlainText(description ?? '', {
    maxLen: CONTENT_LIMITS.sectionDescriptionMax,
    required: false,
    tooLongCode: 'description_too_long',
  });
  return { title: cleanTitle, description: cleanDescription };
}
