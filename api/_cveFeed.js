const TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;
const WINDOW_30D_MS = 30 * 24 * 60 * 60 * 1000;

let cachedPayload = null;
let cachedAt = 0;
let inFlightPromise = null;

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'StatusCheck-Bot/1.0',
      ...headers,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

function buildGithubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
  };
  if (typeof process !== 'undefined' && process.env?.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function normalizeGithubAdvisories(list, cutoffMs, map) {
  if (!Array.isArray(list)) return;

  for (const a of list) {
    const publishedAt = a.published_at || a.updated_at;
    if (!publishedAt) continue;
    const pubMs = new Date(publishedAt).getTime();
    if (!Number.isFinite(pubMs) || pubMs < cutoffMs) continue;

    const id = a.cve_id || a.ghsa_id;
    if (!id) continue;

    const ecosystems = Array.from(
      new Set(
        (a.vulnerabilities || [])
          .map((v) => v.package?.ecosystem?.toLowerCase())
          .filter(Boolean)
      )
    );

    const packages = Array.from(
      new Set(
        (a.vulnerabilities || [])
          .map((v) => v.package?.name)
          .filter(Boolean)
      )
    ).slice(0, 5);

    const severity = (a.severity || 'high').toLowerCase();
    const url =
      a.html_url ||
      (a.cve_id ? `https://nvd.nist.gov/vuln/detail/${a.cve_id}` : 'https://github.com/advisories');

    const existing = map.get(id);
    if (existing) {
      existing.ecosystems = Array.from(new Set([...existing.ecosystems, ...ecosystems]));
      existing.packages = Array.from(new Set([...existing.packages, ...packages])).slice(0, 5);
      if (severity === 'critical') existing.severity = 'critical';
      continue;
    }

    map.set(id, {
      id,
      cveId: a.cve_id || null,
      ghsaId: a.ghsa_id || null,
      severity,
      isKev: false,
      source: 'github',
      publishedAt,
      summary: (a.summary || a.description || '').slice(0, 240),
      url,
      ecosystems,
      packages,
    });
  }
}

function normalizeCisaKevFeed(data, cutoffMs, map) {
  const vulns = Array.isArray(data?.vulnerabilities) ? data.vulnerabilities : [];

  for (const v of vulns) {
    if (!v.cveID || !v.dateAdded) continue;
    const addedMs = new Date(v.dateAdded).getTime();
    if (!Number.isFinite(addedMs) || addedMs < cutoffMs) continue;

    const vendorProduct = `${v.vendorProject || ''} ${v.product || ''}`.trim();
    const existing = map.get(v.cveID);

    if (existing) {
      existing.isKev = true;
      existing.severity = 'critical';
      if (vendorProduct && !existing.packages.includes(vendorProduct)) {
        existing.packages = [vendorProduct, ...existing.packages].slice(0, 5);
      }
      continue;
    }

    map.set(v.cveID, {
      id: v.cveID,
      cveId: v.cveID,
      ghsaId: null,
      severity: 'critical',
      isKev: true,
      source: 'cisa-kev',
      publishedAt: new Date(addedMs).toISOString(),
      summary: `${v.vulnerabilityName || v.cveID}: ${v.shortDescription || ''}`.slice(0, 240),
      url: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
      ecosystems: [],
      packages: vendorProduct ? [vendorProduct] : [],
    });
  }
}

async function fetchAndBuildCveFeed() {
  const ghHeaders = buildGithubHeaders();
  const cutoffMs = Date.now() - WINDOW_30D_MS;

  const sources = [
    fetchJson('https://api.github.com/advisories?type=reviewed&severity=critical&per_page=100', ghHeaders),
    fetchJson('https://api.github.com/advisories?type=reviewed&severity=high&per_page=100', ghHeaders),
    fetchJson('https://api.github.com/advisories?type=unreviewed&severity=critical&per_page=50', ghHeaders),
    fetchJson('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', {
      Accept: 'application/json',
    }),
  ];

  const results = await Promise.allSettled(sources);
  const succeeded = results.filter((r) => r.status === 'fulfilled');

  if (succeeded.length === 0) {
    if (cachedPayload) {
      return cachedPayload;
    }
    throw new Error('All upstream CVE sources failed');
  }

  const map = new Map();

  for (let i = 0; i < 3; i++) {
    if (results[i].status === 'fulfilled') {
      normalizeGithubAdvisories(results[i].value, cutoffMs, map);
    }
  }

  if (results[3].status === 'fulfilled') {
    normalizeCisaKevFeed(results[3].value, cutoffMs, map);
  }

  const advisories = Array.from(map.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const payload = {
    fetchedAt: new Date().toISOString(),
    total: advisories.length,
    advisories,
  };

  cachedPayload = payload;
  cachedAt = Date.now();
  return payload;
}

/**
 * Returns aggregated, deduplicated CVE & CISA KEV advisories from the last 30 days.
 */
export async function getCveFeed() {
  if (cachedPayload && Date.now() - cachedAt < TTL_MS) {
    return cachedPayload;
  }

  if (!inFlightPromise) {
    inFlightPromise = fetchAndBuildCveFeed().finally(() => {
      inFlightPromise = null;
    });
  }

  return inFlightPromise;
}
