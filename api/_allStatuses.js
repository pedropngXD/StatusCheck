import { STATUS_PROVIDERS } from '../src/lib/statusProviders.js';
import { normalizeStatus, createUnknownState } from '../src/lib/normalizeStatus.js';
import { getCveFeed } from './_cveFeed.js';

const CACHE_TTL_MS = 45 * 1000;
const UPSTREAM_TIMEOUT_MS = 4500;
const SERVER_CONCURRENCY = 48;

let cachedSnapshot = null;
let cachedAt = 0;
let inFlightPromise = null;

async function fetchUpstreamRaw(url, provider) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      'User-Agent': 'StatusCheck-Bot/1.0 (Dashboard Health Monitor)',
      Accept: 'application/json, text/html, text/plain, application/xml, */*',
    },
  });

  if (url.includes('status.aws.amazon.com/data.json')) {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const decodedText = buffer.swap16().toString('utf16le').replace(/^\uFEFF/, '').trim();
    return JSON.parse(decodedText);
  }

  if (!res.ok) {
    if (provider.adapter === 'api-health' && (res.status === 401 || res.status === 429)) {
      return { httpStatus: res.status, operational: true };
    }
    throw new Error(`HTTP ${res.status}`);
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (
    provider.adapter === 'betterstack-badge' ||
    provider.adapter === 'cstate-json' ||
    provider.adapter === 'netflix-health' ||
    provider.adapter === 'apple-json' ||
    provider.adapter === 'azure-rss' ||
    contentType.includes('text/html') ||
    contentType.includes('text/plain') ||
    contentType.includes('javascript') ||
    contentType.includes('xml')
  ) {
    return await res.text();
  }

  return await res.json();
}

function compactNormalized(data) {
  return {
    status: data.status || 'unknown',
    statusDescription: data.statusDescription || '',
    indicator: data.indicator || 'unknown',
    updatedAt: data.updatedAt || null,
    incidents: Array.isArray(data.incidents) ? data.incidents.slice(0, 15) : [],
    components: Array.isArray(data.components)
      ? data.components.map(({ id, name, status }) => ({ id, name, status }))
      : [],
  };
}

async function buildSnapshot() {
  const startTime = Date.now();
  const cveProviders = [];
  const urlGroups = new Map();

  for (const provider of STATUS_PROVIDERS) {
    if (provider.apiUrl === '/api/cve') {
      cveProviders.push(provider);
      continue;
    }
    if (!urlGroups.has(provider.apiUrl)) {
      urlGroups.set(provider.apiUrl, []);
    }
    urlGroups.get(provider.apiUrl).push(provider);
  }

  const cvePromise = getCveFeed().catch((err) => ({ __error: err.message || 'CVE feed failed' }));
  const results = {};
  const entries = Array.from(urlGroups.entries());
  let nextIdx = 0;

  const runWorker = async () => {
    while (nextIdx < entries.length) {
      const [url, group] = entries[nextIdx++];
      try {
        const raw = await fetchUpstreamRaw(url, group[0]);
        for (const provider of group) {
          try {
            results[provider.id] = compactNormalized(normalizeStatus(provider, raw));
          } catch (normErr) {
            results[provider.id] = compactNormalized(
              createUnknownState(normErr.message || 'Normalization failed')
            );
          }
        }
      } catch (fetchErr) {
        const errState = compactNormalized(
          createUnknownState(fetchErr.message || 'Upstream request failed')
        );
        for (const provider of group) {
          results[provider.id] = errState;
        }
      }
    }
  };

  const workerCount = Math.min(SERVER_CONCURRENCY, entries.length);
  await Promise.all([
    Promise.allSettled(Array.from({ length: workerCount }, () => runWorker())),
    cvePromise.then((cveData) => {
      if (cveData && !cveData.__error) {
        for (const provider of cveProviders) {
          try {
            results[provider.id] = compactNormalized(normalizeStatus(provider, cveData));
          } catch (normErr) {
            results[provider.id] = compactNormalized(
              createUnknownState(normErr.message || 'CVE normalization failed')
            );
          }
        }
      } else {
        const errState = compactNormalized(
          createUnknownState(cveData?.__error || 'CVE feed unavailable')
        );
        for (const provider of cveProviders) {
          results[provider.id] = errState;
        }
      }
    }),
  ]);

  const payload = {
    fetchedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    total: STATUS_PROVIDERS.length,
    statuses: results,
  };

  cachedSnapshot = payload;
  cachedAt = Date.now();
  return payload;
}

/**
 * Returns aggregated and normalized status snapshot for all monitored providers.
 */
export async function getAllStatuses({ force = false } = {}) {
  if (!force && cachedSnapshot && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  if (!force && inFlightPromise) {
    return inFlightPromise;
  }

  const promise = buildSnapshot();
  if (!force) {
    inFlightPromise = promise.finally(() => {
      inFlightPromise = null;
    });
  }

  return promise;
}
