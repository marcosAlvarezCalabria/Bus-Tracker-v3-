import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";
import ga from "./locales/ga.json";

const storageKey = "bus-tracker-language";
const supportedLanguages = ["ga", "en", "es"] as const;

const getStoredLanguage = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(storageKey);
};

const getBrowserLanguage = (): string | null => {
  if (typeof navigator === "undefined") {
    return null;
  }

  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().split("-")[0];

    if (supportedLanguages.includes(normalizedCandidate as (typeof supportedLanguages)[number])) {
      return normalizedCandidate;
    }
  }

  return null;
};

const detectLanguage = (): string => {
  const storedLanguage = getStoredLanguage();

  if (storedLanguage && supportedLanguages.includes(storedLanguage as (typeof supportedLanguages)[number])) {
    return storedLanguage;
  }

  return getBrowserLanguage() ?? "en";
};

void i18n.use(initReactI18next).init({
  resources: {
    ga: { translation: ga },
    en: { translation: en },
    es: { translation: es }
  },
  lng: detectLanguage(),
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  interpolation: {
    escapeValue: false
  }
});

i18n.on("languageChanged", (language) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, language);
  }
});

export default i18n;
