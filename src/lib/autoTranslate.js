import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'statuscheck_auto_translations_pt';
const MAX_CLIENT_CACHE = 500;

const clientCache = new Map();
const failedTexts = new Set();

function loadPersistedCache() {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
      if (Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'string') {
        clientCache.set(entry[0], entry[1]);
      }
    }
  } catch {
    // Ignore storage read issues
  }
}

function persistCache() {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    const entries = Array.from(clientCache.entries()).slice(-MAX_CLIENT_CACHE);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage quota issues
  }
}

loadPersistedCache();

function setClientCacheEntry(key, value) {
  if (clientCache.size >= MAX_CLIENT_CACHE) {
    const oldest = clientCache.keys().next().value;
    if (oldest !== undefined) {
      clientCache.delete(oldest);
    }
  }
  clientCache.set(key, value);
}

/**
 * Automatically translates dynamic English incident texts to Portuguese when lang === 'pt-BR'.
 */
export function useAutoTranslate(texts = [], lang = 'en') {
  const [cacheVersion, setCacheVersion] = useState(0);

  const normalizedTexts = useMemo(() => {
    if (!Array.isArray(texts) || lang !== 'pt-BR') return [];
    const seen = new Set();
    const list = [];
    for (const item of texts) {
      if (typeof item === 'string' && item.trim() && !seen.has(item)) {
        seen.add(item);
        list.push(item);
      }
    }
    return list;
  }, [texts, lang]);

  const missingTexts = useMemo(() => {
    void cacheVersion;
    if (lang !== 'pt-BR') return [];
    return normalizedTexts.filter((text) => !clientCache.has(text) && !failedTexts.has(text));
  }, [normalizedTexts, lang, cacheVersion]);

  const missingKey = missingTexts.join('\u0001');

  useEffect(() => {
    if (lang !== 'pt-BR' || !missingKey) return;

    const pending = missingKey.split('\u0001').filter(Boolean);
    if (pending.length === 0) return;

    let cancelled = false;

    async function runTranslation() {
      const CHUNK_SIZE = 25;
      for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
        if (cancelled) return;
        const chunk = pending.slice(i, i + CHUNK_SIZE);
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: chunk, target: 'pt-BR' }),
          });
          if (!res.ok) {
            for (const text of chunk) failedTexts.add(text);
            continue;
          }
          const data = await res.json();
          const map = data?.translations || {};
          for (const text of chunk) {
            if (typeof map[text] === 'string' && map[text].trim()) {
              setClientCacheEntry(text, map[text]);
            } else {
              failedTexts.add(text);
            }
          }
          persistCache();
        } catch {
          for (const text of chunk) failedTexts.add(text);
        } finally {
          if (!cancelled) {
            setCacheVersion((v) => v + 1);
          }
        }
      }
    }

    runTranslation();

    return () => {
      cancelled = true;
    };
  }, [lang, missingKey]);

  const translate = useCallback(
    (text) => {
      void cacheVersion;
      if (typeof text !== 'string' || !text || lang !== 'pt-BR') {
        return text;
      }
      return clientCache.get(text) ?? text;
    },
    [lang, cacheVersion]
  );

  return {
    translate,
    translating: lang === 'pt-BR' && missingTexts.length > 0,
  };
}
