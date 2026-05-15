"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { type Language } from "@/lib/i18n";

interface LanguageContextType {
  lang:      Language;
  setLang:   (l: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang:    "en",
  setLang: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("twiller-lang") as Language | null;
    if (saved) setLangState(saved);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("twiller-lang", l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};