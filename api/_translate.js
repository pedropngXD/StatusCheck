const MAX_CACHE_ENTRIES = 2000;
const translationCache = new Map();

function setCache(key, value) {
  if (translationCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = translationCache.keys().next().value;
    if (oldestKey !== undefined) {
      translationCache.delete(oldestKey);
    }
  }
  translationCache.set(key, value);
}

async function translateWithGoogle(text, targetLang = 'pt') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data?.[0])) return null;
  const translated = data[0]
    .map((part) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
    .join('')
    .trim();
  return translated || null;
}

async function translateWithMyMemory(text, targetLang = 'pt-BR') {
  if (text.length > 500) return null;
  const langPair = `en|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  return typeof translated === 'string' && translated.trim() ? translated.trim() : null;
}

async function translateSingle(text, target = 'pt-BR') {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return text;

  const clipped = trimmed.slice(0, 2500);
  const cacheKey = `${target}::${clipped}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const googleTarget = target.toLowerCase().startsWith('pt') ? 'pt' : target;
  let translated = null;

  try {
    translated = await translateWithGoogle(clipped, googleTarget);
  } catch {
    translated = null;
  }

  if (!translated) {
    try {
      translated = await translateWithMyMemory(clipped, target);
    } catch {
      translated = null;
    }
  }

  if (translated) {
    setCache(cacheKey, translated);
    return translated;
  }

  return text;
}

export async function translateBatch(texts = [], target = 'pt-BR') {
  if (!Array.isArray(texts) || texts.length === 0) {
    return { translations: {} };
  }

  const unique = [];
  const seen = new Set();
  for (const item of texts) {
    if (typeof item === 'string' && item.trim() && !seen.has(item)) {
      seen.add(item);
      unique.push(item);
      if (unique.length >= 40) break;
    }
  }

  const translations = {};
  const toFetch = [];

  for (const text of unique) {
    const cacheKey = `${target}::${text.trim().slice(0, 2500)}`;
    if (translationCache.has(cacheKey)) {
      translations[text] = translationCache.get(cacheKey);
    } else {
      toFetch.push(text);
    }
  }

  if (toFetch.length > 0) {
    const CONCURRENCY = 8;
    let index = 0;

    async function worker() {
      while (index < toFetch.length) {
        const current = toFetch[index];
        index += 1;
        translations[current] = await translateSingle(current, target);
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, toFetch.length) }, () => worker());
    await Promise.all(workers);
  }

  return { translations };
}
