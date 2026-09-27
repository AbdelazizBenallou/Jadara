import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./ar.json";
import en from "./en.json";
import fr from "./fr.json";

export const LANGUAGES = ["ar", "en", "fr"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANG_DIR: Record<Language, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
  fr: "ltr",
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: "ar",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export default i18n;
