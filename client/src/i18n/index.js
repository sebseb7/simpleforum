import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import 'dayjs/locale/en.js';
import 'dayjs/locale/de.js';
import en from './locales/en.json';
import de from './locales/de.json';

dayjs.extend(localizedFormat);

export const LANG_STORAGE_KEY = 'romanum_lang';
export const SUPPORTED_LANGS = ['en', 'de'];

/** Normalize any locale tag to a supported UI lang. */
export function normalizeLang(lang) {
  const raw = String(lang || '').toLowerCase();
  if (raw.startsWith('de')) return 'de';
  if (SUPPORTED_LANGS.includes(raw)) return raw;
  return 'en';
}

export function getStoredLang() {
  try {
    return normalizeLang(localStorage.getItem(LANG_STORAGE_KEY));
  } catch {
    return 'en';
  }
}

export function setStoredLang(lang) {
  const next = normalizeLang(lang);
  try {
    localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch {
    // ignore quota / private mode
  }
  return next;
}

function applyDocumentLang(lang) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

function applyDayjsLocale(lang) {
  const dateLocale = i18n.getResource(lang, 'translation', 'dateLocale') || lang;
  dayjs.locale(dateLocale);
}

const initialLang = getStoredLang();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: initialLang,
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGS,
  nonExplicitSupportedLngs: true,
  load: 'languageOnly',
  interpolation: { escapeValue: false },
});

applyDocumentLang(initialLang);
applyDayjsLocale(initialLang);

i18n.on('languageChanged', (lang) => {
  const next = setStoredLang(lang);
  applyDocumentLang(next);
  applyDayjsLocale(next);
});

export function changeLanguage(lang) {
  const next = normalizeLang(lang);
  if (!SUPPORTED_LANGS.includes(next)) return Promise.resolve();
  // Persist immediately so a fast reload still sees the choice.
  setStoredLang(next);
  return i18n.changeLanguage(next);
}

export default i18n;
