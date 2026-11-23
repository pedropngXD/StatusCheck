const EOL_SLUGS = {
  'lang-python': 'python',
  'lang-javascript': 'nodejs',
  'lang-java': 'eclipse-temurin',
  'lang-csharp': 'dotnet',
  'lang-go': 'go',
  'lang-rust': 'rust',
  'lang-php': 'php',
  'lang-ruby': 'ruby',
  'lang-kotlin': 'kotlin',
  'lang-scala': 'scala',
  'lang-elixir': 'elixir',
  'lang-erlang': 'erlang',
  'lang-perl': 'perl',
  'lang-lua': 'lua',
  'lang-haskell': 'haskell',
  'cve-kubernetes': 'kubernetes',
  'cve-docker': 'docker-engine',
  'cve-linux': 'linux',
  'cve-nginx': 'nginx',
  'cve-postgresql': 'postgresql',
  'cve-redis': 'redis',
  'cve-wordpress': 'wordpress',
  'cve-nextjs-react': 'nextjs',
  'cve-spring': 'spring-boot',
  'cve-laravel': 'laravel',
};

const EOL_SOON_MS = 180 * 24 * 60 * 60 * 1000;
const eolCache = new Map();

export function getEolSlug(providerId) {
  return EOL_SLUGS[providerId] || null;
}

function parseCycle(c, now) {
  const eolDate = typeof c.eol === 'string' ? new Date(c.eol) : null;
  const eolMs = eolDate && !Number.isNaN(eolDate.getTime()) ? eolDate.getTime() : null;
  const isEol = c.eol === true || (eolMs !== null && eolMs < now);
  const isEolSoon = !isEol && eolMs !== null && eolMs - now <= EOL_SOON_MS;
  const isLts =
    c.lts === true ||
    (typeof c.lts === 'string' && !Number.isNaN(new Date(c.lts).getTime()) && new Date(c.lts).getTime() <= now);

  const eolLabel =
    c.eol === false || c.eol == null
      ? 'Supported'
      : c.eol === true
      ? 'Ended'
      : String(c.eol);

  const status = isEol ? 'eol' : isEolSoon ? 'eol-soon' : isLts ? 'lts' : 'active';

  return {
    cycle: String(c.cycle || ''),
    latest: c.latest ? String(c.latest) : null,
    releaseDate: c.releaseDate || null,
    eolLabel,
    isEol,
    isEolSoon,
    isLts,
    status,
  };
}

export async function fetchEolData(slug) {
  if (!slug) return null;
  if (eolCache.has(slug)) {
    return eolCache.get(slug);
  }

  const directUrl = `https://endoflife.date/api/${encodeURIComponent(slug)}.json`;
  let raw = null;

  try {
    const res = await fetch(directUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      raw = await res.json();
    }
  } catch {}

  if (!raw) {
    try {
      const proxyUrl = `/api/status?url=${encodeURIComponent(directUrl)}`;
      const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (proxyRes.ok) {
        raw = await proxyRes.json();
      }
    } catch {}
  }

  if (!Array.isArray(raw)) {
    return null;
  }

  const now = Date.now();
  const parsed = raw.map((c) => parseCycle(c, now));

  const activeSet = new Set();
  const endedSet = new Set();

  for (const item of parsed) {
    if (!item.isEol && activeSet.size < 4) {
      activeSet.add(item.cycle);
    } else if (item.isEol && endedSet.size < 2) {
      endedSet.add(item.cycle);
    }
    if (activeSet.size >= 4 && endedSet.size >= 2) break;
  }

  const cycles = parsed
    .filter((item) => activeSet.has(item.cycle) || endedSet.has(item.cycle))
    .slice(0, 6);

  const result = {
    slug,
    pageUrl: `https://endoflife.date/${slug}`,
    cycles,
  };

  eolCache.set(slug, result);
  return result;
}
