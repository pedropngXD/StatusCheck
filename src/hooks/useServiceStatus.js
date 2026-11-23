import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { STATUS_PROVIDERS } from '../lib/statusProviders';
import { normalizeStatus, createUnknownState } from '../lib/normalizeStatus';

const REQUEST_TIMEOUT_MS = 8000;
const CONCURRENCY_LIMIT = 16;
const CORS_PROXY_URL = 'https://api.allorigins.win/raw?url=';
const STORAGE_TELEMETRY_CACHE_KEY = 'statuscheck_telemetry_cache';
const NO_CORS_PROVIDERS = new Set(['aws', 'cloudflare', 'stripe', 'huggingface']);

function loadCachedStatuses(providers) {
  try {
    const raw = localStorage.getItem(STORAGE_TELEMETRY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const initial = {};
    let hasData = false;

    providers.forEach((p) => {
      const entry = parsed[p.id];
      if (entry && entry.data) {
        hasData = true;
        initial[p.id] = {
          data: entry.data,
          loading: false,
          error: null,
          lastFetched: entry.lastFetched ? new Date(entry.lastFetched) : null,
        };
      } else {
        initial[p.id] = {
          data: null,
          loading: true,
          error: null,
          lastFetched: null,
        };
      }
    });

    return hasData ? initial : null;
  } catch {
    return null;
  }
}

function saveTelemetryCache(statuses) {
  try {
    const toSave = {};
    Object.entries(statuses).forEach(([id, val]) => {
      if (val && val.data) {
        toSave[id] = {
          data: val.data,
          lastFetched: val.lastFetched,
        };
      }
    });
    localStorage.setItem(STORAGE_TELEMETRY_CACHE_KEY, JSON.stringify(toSave));
  } catch {}
}

async function fetchRawUrl(provider, signal) {
  const fetchWithTimeout = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json, text/html, text/plain, */*' },
        cache: 'no-cache',
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const parseResponse = async (res) => {
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (
      provider.adapter === 'betterstack-badge' ||
      provider.adapter === 'netflix-health' ||
      provider.adapter === 'apple-json' ||
      contentType.includes('text/html') ||
      contentType.includes('text/plain') ||
      contentType.includes('javascript')
    ) {
      return await res.text();
    }
    return await res.json();
  };

  if (provider.apiUrl.startsWith('/api/')) {
    try {
      const res = await fetchWithTimeout(provider.apiUrl);
      if (res.ok) {
        return await parseResponse(res);
      }
      throw new Error(`HTTP error ${res.status}`);
    } catch (err) {
      if (signal?.aborted || !provider.fallbackApiUrl) {
        throw err;
      }
      const fallbackRes = await fetchWithTimeout(provider.fallbackApiUrl);
      if (!fallbackRes.ok) {
        throw new Error(`Fallback HTTP error ${fallbackRes.status}`);
      }
      return await parseResponse(fallbackRes);
    }
  }

  if (provider.useProxy || NO_CORS_PROVIDERS.has(provider.id) || provider.adapter === 'aws-json') {
    try {
      const proxyUrl = `/api/status?url=${encodeURIComponent(provider.apiUrl)}&_t=${Date.now()}`;
      const proxyRes = await fetchWithTimeout(proxyUrl);
      if (proxyRes.ok || (provider.adapter === 'api-health' && (proxyRes.status === 401 || proxyRes.status === 429))) {
        return await parseResponse(proxyRes);
      }
    } catch {}
  }

  try {
    const res = await fetchWithTimeout(provider.apiUrl);
    if (!res.ok) {
      if (provider.adapter === 'api-health' && (res.status === 401 || res.status === 429)) {
        return { httpStatus: res.status, operational: true };
      }
      throw new Error(`HTTP error ${res.status}`);
    }
    return await parseResponse(res);
  } catch (directErr) {
    if (signal?.aborted) {
      throw directErr;
    }

    try {
      const vercelProxyUrl = `/api/status?url=${encodeURIComponent(provider.apiUrl)}&_t=${Date.now()}`;
      const vercelRes = await fetchWithTimeout(vercelProxyUrl);
      if (vercelRes.ok || (provider.adapter === 'api-health' && (vercelRes.status === 401 || vercelRes.status === 429))) {
        return await parseResponse(vercelRes);
      }
    } catch {}

    const proxyUrl = `${CORS_PROXY_URL}${encodeURIComponent(provider.apiUrl)}`;
    const proxyRes = await fetchWithTimeout(proxyUrl);
    if (proxyRes.ok || (provider.adapter === 'api-health' && (proxyRes.status === 401 || proxyRes.status === 429))) {
      return await parseResponse(proxyRes);
    }
    throw new Error(`Proxy HTTP error ${proxyRes.status}`);
  }
}

async function fetchProviderStatus(provider, signal, cycleCache) {
  const cacheKey = provider.apiUrl;

  if (!cycleCache.has(cacheKey)) {
    const promise = fetchRawUrl(provider, signal).catch((err) => {
      return { __fetchError: err.message || 'Network request failed' };
    });
    cycleCache.set(cacheKey, promise);
  }

  const rawData = await cycleCache.get(cacheKey);
  if (rawData && rawData.__fetchError) {
    return createUnknownState(rawData.__fetchError);
  }

  return normalizeStatus(provider, rawData);
}

export function useServiceStatus(providers = STATUS_PROVIDERS, options = {}) {
  const { pollingInterval = 60000, enabled = true } = options;

  const cachedInitial = useMemo(() => loadCachedStatuses(providers), [providers]);

  const [statuses, setStatuses] = useState(() => {
    if (cachedInitial) return cachedInitial;

    const initial = {};
    providers.forEach((p) => {
      initial[p.id] = {
        data: null,
        loading: true,
        error: null,
        lastFetched: null,
      };
    });
    return initial;
  });

  const [isInitialLoading, setIsInitialLoading] = useState(!cachedInitial);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCycleAt, setLastCycleAt] = useState(() => {
    try {
      const savedTime = localStorage.getItem('statuscheck_last_cycle_time');
      return savedTime ? new Date(savedTime) : null;
    } catch {
      return null;
    }
  });

  const activeAbortRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortRef.current = controller;

    setIsRefreshing(true);

    setStatuses((prev) => {
      const next = { ...prev };
      providers.forEach((p) => {
        next[p.id] = {
          ...next[p.id],
          loading: true,
        };
      });
      return next;
    });

    const startTime = performance.now();
    console.log(`[StatusCheck] 🔄 Fetching live status for ${providers.length} services...`);

    const cycleCache = new Map();
    let nextIndex = 0;

    const runWorker = async () => {
      while (nextIndex < providers.length) {
        if (controller.signal.aborted) return;
        const provider = providers[nextIndex++];
        try {
          const normalized = await fetchProviderStatus(provider, controller.signal, cycleCache);
          if (controller.signal.aborted) return;

          setStatuses((prev) => ({
            ...prev,
            [provider.id]: {
              data: normalized,
              loading: false,
              error: null,
              lastFetched: new Date(),
            },
          }));
        } catch (err) {
          if (controller.signal.aborted) return;

          setStatuses((prev) => ({
            ...prev,
            [provider.id]: {
              data: createUnknownState(err.message || 'Fetch failed'),
              loading: false,
              error: err.message,
              lastFetched: new Date(),
            },
          }));
        }
      }
    };

    const workerCount = Math.min(CONCURRENCY_LIMIT, providers.length);
    await Promise.allSettled(Array.from({ length: workerCount }, () => runWorker()));

    if (controller.signal.aborted) {
      return;
    }

    const duration = Math.round(performance.now() - startTime);
    console.log(`[StatusCheck] ✓ Telemetry updated for ${providers.length} services in ${duration}ms at ${new Date().toLocaleTimeString()}.`);

    const now = new Date();
    setIsInitialLoading(false);
    setIsRefreshing(false);
    setLastCycleAt(now);

    try {
      localStorage.setItem('statuscheck_last_cycle_time', now.toISOString());
    } catch {}

    setStatuses((latest) => {
      saveTelemetryCache(latest);
      return latest;
    });
  }, [providers]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      fetchAll();
    }, 0);

    let intervalId = null;
    if (pollingInterval && pollingInterval > 0) {
      intervalId = setInterval(fetchAll, pollingInterval);
    }

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
      if (activeAbortRef.current) {
        activeAbortRef.current.abort();
      }
    };
  }, [fetchAll, pollingInterval, enabled]);

  const summary = useMemo(() => {
    let operational = 0;
    let degraded = 0;
    let outage = 0;
    let unknown = 0;

    providers.forEach((p) => {
      const statusObj = statuses[p.id];
      const statusType = statusObj?.data?.status;

      if (!statusType || statusObj?.loading) {
        unknown++;
      } else if (statusType === 'operational') {
        operational++;
      } else if (statusType === 'degraded') {
        degraded++;
      } else if (statusType === 'outage') {
        outage++;
      } else {
        unknown++;
      }
    });

    return {
      total: providers.length,
      operational,
      degraded,
      outage,
      unknown,
    };
  }, [providers, statuses]);

  return {
    statuses,
    summary,
    loading: isInitialLoading,
    refreshing: isRefreshing,
    lastCycleAt,
    refetch: fetchAll,
  };
}
