import dayjs from 'dayjs';
import i18n from './index.js';

/** Format SQLite `datetime('now')` / ISO-ish values with the active dateLocale. */
export function formatForumDate(value) {
  if (!value) return '';
  const dateLocale = i18n.t('dateLocale') || 'en';
  const normalized =
    typeof value === 'string' && value.includes(' ') && !value.includes('T')
      ? value.replace(' ', 'T')
      : value;
  const parsed = dayjs(normalized);
  if (!parsed.isValid()) return String(value);
  return parsed.locale(dateLocale).format('LLL');
}
