import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_PINNED_KEY = 'statuscheck_pinned_services';

function loadPinnedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_PINNED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((id) => typeof id === 'string');
      }
    }
  } catch {}
  return [];
}

export function usePinnedServices() {
  const [pinnedIds, setPinnedIds] = useState(loadPinnedIds);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PINNED_KEY, JSON.stringify(pinnedIds));
    } catch {}
  }, [pinnedIds]);

  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  const isPinned = useCallback((id) => pinnedSet.has(id), [pinnedSet]);

  const togglePin = useCallback((id) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  return {
    pinnedIds,
    pinnedSet,
    isPinned,
    togglePin,
  };
}
