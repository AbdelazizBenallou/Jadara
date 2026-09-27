import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import i18n, { LANG_DIR, LANGUAGES, type Language } from "@/i18n";

interface LanguageContextValue {
  language: Language;
  direction: "rtl" | "ltr";
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "ar",
  direction: "rtl",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");

  useEffect(() => {
    const stored = window.localStorage.getItem("jadara-lang") as Language | null;
    if (stored && LANGUAGES.includes(stored)) {
      setLanguageState(stored);
      i18n.changeLanguage(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = LANG_DIR[language];
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    window.localStorage.setItem("jadara-lang", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, direction: LANG_DIR[language], setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
