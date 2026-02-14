"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import enCommon from '../../public/locales/en/common.json';
import kmCommon from '../../public/locales/km/common.json';

const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  i18n
    .use(HttpBackend)
    .use(LanguageDetector);
}

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'km'],
    ns: ['common'],
    defaultNS: 'common',
    debug: false,
    resources: {
      en: {
        common: enCommon
      },
      km: {
        common: kmCommon
      }
    },
    interpolation: {
      escapeValue: false, // React handles escaping
    },
    react: {
      useSuspense: false, // Disable suspense to prevent build hangs
    },
    backend: isBrowser ? {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    } : undefined,
    detection: isBrowser ? {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    } : undefined,
  });

export default i18n;
