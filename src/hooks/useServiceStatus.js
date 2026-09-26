import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { STATUS_PROVIDERS } from '../lib/statusProviders';
import { normalizeStatus, createUnknownState } from '../lib/normalizeStatus';

const REQUEST_TIMEOUT_MS = 10000;
const CORS_PROXY_URL = 'https://api.allorigins.win/raw?url=';

/**
 * Attempts to fetch a provider's status, first directly, then via a CORS proxy fallback if needed.
 */
async function fetchProviderStatus(provider, signal) {
  const fetchWithTimeout = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Link incoming signal to internal controller
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json, text/html, */*' },
        cache: 'no-cache', // Bypass local browser disk/memory cache for fresh live data
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const parseResponse = async (res) => {
    const contentType = res.headers.get('content-type') || '';
    if (provider.adapter === 'betterstack-badge' || contentType.includes('text/html')) {
      return await res.text();
    }
    return await res.json();
  };

  try {
    // 1. Direct fetch attempt
    const res = await fetchWithTimeout(provider.apiUrl);
    if (!res.ok) {
      if (provider.adapter === 'api-health' && (res.status === 401 || res.status === 429)) {
        return normalizeStatus(provider, { httpStatus: res.status, operational: true });
      }
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await parseResponse(res);
    return normalizeStatus(provider, data);
  } catch (directErr) {
    // If request was explicitly aborted by component unmount, rethrow
    if (signal?.aborted) {
      throw directErr;
    }

    // 2. Try Vercel Serverless Function proxy (/api/status?url=...) with cache buster
    try {
      const vercelProxyUrl = `/api/status?url=${encodeURIComponent(provider.apiUrl)}&_t=${Date.now()}`;
      const vercelRes = await fetchWithTimeout(vercelProxyUrl);
      if (vercelRes.ok || (provider.adapter === 'api-health' && (vercelRes.status === 401 || vercelRes.status === 429))) {
        const vercelData = await parseResponse(vercelRes);
        return normalizeStatus(provider, vercelData);
      }
    } catch {
      // Continue to next fallback
    }

    // 3. Fallback to public CORS proxy if running outside Vercel
    try {
      const proxyUrl = `${CORS_PROXY_URL}${encodeURIComponent(provider.apiUrl)}`;
      const proxyRes = await fetchWithTimeout(proxyUrl);
      if (proxyRes.ok || (provider.adapter === 'api-health' && (proxyRes.status === 401 || proxyRes.status === 429))) {
        const proxyData = await parseResponse(proxyRes);
        return normalizeStatus(provider, proxyData);
      }
      throw new Error(`Proxy HTTP error ${proxyRes.status}`);
    } catch {
      // Return a safe fallback status indicating the failure
      return createUnknownState(directErr.message || 'Network request failed');
    }
  }
}

/**
 * Custom hook to monitor and fetch status of services in parallel.
 * Supports auto-polling, manual refetch, and aggregated summary stats.
 *
 * @param {Array} providers - List of providers to fetch (defaults to STATUS_PROVIDERS)
 * @param {Object} options - Configuration options
 * @param {number} options.pollingInterval - Interval in ms between automatic refetches (default 60000 = 60s)
 * @param {boolean} options.enabled - Whether polling is active (default true)
 */
export function useServiceStatus(providers = STATUS_PROVIDERS, options = {}) {
  const { pollingInterval = 60000, enabled = true } = options;

  const [statuses, setStatuses] = useState(() => {
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

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCycleAt, setLastCycleAt] = useState(null);

  const activeAbortRef = useRef(null);

  const fetchAll = useCallback(async () => {
    // Cancel any in-flight request cycle
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortRef.current = controller;

    setIsRefreshing(true);

    // Immediately put every single provider into loading state so badges show 'Checking...'
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

    const promises = providers.map(async (provider) => {
      try {
        const normalized = await fetchProviderStatus(provider, controller.signal);
        if (controller.signal.aborted) return null;

        // Progressively update each service card as soon as its response arrives
        setStatuses((prev) => ({
          ...prev,
          [provider.id]: {
            data: normalized,
            loading: false,
            error: null,
            lastFetched: new Date(),
          },
        }));

        return {
          id: provider.id,
          success: true,
          data: normalized,
          error: null,
        };
      } catch (err) {
        if (controller.signal.aborted) {
          return null; // Ignore aborted requests
        }

        setStatuses((prev) => ({
          ...prev,
          [provider.id]: {
            data: createUnknownState(err.message || 'Fetch failed'),
            loading: false,
            error: err.message,
            lastFetched: new Date(),
          },
        }));

        return {
          id: provider.id,
          success: false,
          data: createUnknownState(err.message || 'Fetch failed'),
          error: err.message,
        };
      }
    });

    await Promise.allSettled(promises);

    // If cycle was cancelled midway, do not update state
    if (controller.signal.aborted) {
      return;
    }

    const duration = Math.round(performance.now() - startTime);
    console.log(`[StatusCheck] ✓ Telemetry updated for ${providers.length} services in ${duration}ms at ${new Date().toLocaleTimeString()}.`);

    setIsInitialLoading(false);
    setIsRefreshing(false);
    setLastCycleAt(new Date());
  }, [providers]);

  // Initial fetch and polling effect
  useEffect(() => {
    if (!enabled) return;

    fetchAll();

    if (pollingInterval && pollingInterval > 0) {
      const intervalId = setInterval(fetchAll, pollingInterval);
      return () => {
        clearInterval(intervalId);
        if (activeAbortRef.current) {
          activeAbortRef.current.abort();
        }
      };
    }

    return () => {
      if (activeAbortRef.current) {
        activeAbortRef.current.abort();
      }
    };
  }, [fetchAll, pollingInterval, enabled]);

  // Summary counts of all current statuses
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
