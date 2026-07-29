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

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return 'en';
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

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: readStoredLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

applyDocumentLang(i18n.language);
applyDayjsLocale(i18n.language);

i18n.on('languageChanged', (lang) => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  applyDocumentLang(lang);
  applyDayjsLocale(lang);
});

export function changeLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return Promise.resolve();
  return i18n.changeLanguage(lang);
}

export default i18n;
