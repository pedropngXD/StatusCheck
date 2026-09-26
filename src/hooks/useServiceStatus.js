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
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  try {
    // 1. Direct fetch attempt
    const res = await fetchWithTimeout(provider.apiUrl);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    return normalizeStatus(provider, data);
  } catch (directErr) {
    // If request was explicitly aborted by component unmount, rethrow
    if (signal?.aborted) {
      throw directErr;
    }

    // 2. CORS or network fallback attempt via public proxy
    try {
      const proxyUrl = `${CORS_PROXY_URL}${encodeURIComponent(provider.apiUrl)}`;
      const proxyRes = await fetchWithTimeout(proxyUrl);
      if (!proxyRes.ok) {
        throw new Error(`Proxy HTTP error ${proxyRes.status}`);
      }
      const proxyData = await proxyRes.json();
      return normalizeStatus(provider, proxyData);
    } catch (proxyErr) {
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

    const promises = providers.map(async (provider) => {
      try {
        const normalized = await fetchProviderStatus(provider, controller.signal);
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
        return {
          id: provider.id,
          success: false,
          data: createUnknownState(err.message || 'Fetch failed'),
          error: err.message,
        };
      }
    });

    const results = await Promise.allSettled(promises);

    // If cycle was cancelled midway, do not update state
    if (controller.signal.aborted) {
      return;
    }

    setStatuses((prev) => {
      const next = { ...prev };
      results.forEach((item) => {
        if (item.status === 'fulfilled' && item.value) {
          const { id, data, error } = item.value;
          next[id] = {
            data,
            loading: false,
            error,
            lastFetched: new Date(),
          };
        }
      });
      return next;
    });

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
