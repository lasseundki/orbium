import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './de';
import en from './en';
import es from './es';

const savedLang = localStorage.getItem('crm_lang') || 'de';

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    es: { translation: es },
  },
  lng: savedLang,
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
});

export default i18n;
