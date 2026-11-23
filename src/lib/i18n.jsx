import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  PRESET_LABELS,
  formatTranslation,
  LanguageContext,
} from './translations';

const STORAGE_LANG_KEY = 'statuscheck_lang';

function loadSavedLang() {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'en' || saved === 'pt-BR') return saved;
  } catch {}
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(loadSavedLang);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
      document.documentElement.lang = lang === 'pt-BR' ? 'pt-BR' : 'en';
    } catch {}
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'pt-BR' : 'en'));
  }, []);

  const t = useCallback((key, vars) => formatTranslation(lang, key, vars), [lang]);

  const statusLabel = useCallback(
    (status, lowercase = false) => {
      const normalized = (status || 'unknown').toLowerCase();
      const map = STATUS_LABELS[lang] || STATUS_LABELS.en;
      const label = map[normalized] || map.unknown;
      return lowercase ? label.toLowerCase() : label;
    },
    [lang]
  );

  const categoryLabel = useCallback(
    (categoryId) => {
      const map = CATEGORY_LABELS[lang] || CATEGORY_LABELS.en;
      return map[categoryId] || categoryId;
    },
    [lang]
  );

  const presetName = useCallback(
    (preset) => {
      if (!preset) return '';
      if (preset.isDefault) {
        const map = PRESET_LABELS[lang] || PRESET_LABELS.en;
        return map[preset.id] || preset.name;
      }
      return preset.name;
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
      statusLabel,
      categoryLabel,
      presetName,
    }),
    [lang, toggleLang, t, statusLabel, categoryLabel, presetName]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
