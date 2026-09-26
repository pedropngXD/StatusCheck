import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'statuscheck_view_mode';
export const VIEW_MODES = {
  GRID: 'grid',
  ROW: 'row',
};

/**
 * Hook to manage and persist the layout view mode ('grid' vs 'row') in localStorage.
 *
 * @param {string} defaultMode - Initial fallback mode ('grid' | 'row')
 */
export function useViewMode(defaultMode = VIEW_MODES.GRID) {
  const [viewMode, setViewModeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === VIEW_MODES.GRID || saved === VIEW_MODES.ROW) {
        return saved;
      }
    } catch {
      // Ignore localStorage access errors (e.g. sandboxed iframe or private browsing)
    }
    return defaultMode;
  });

  const setViewMode = useCallback((mode) => {
    if (mode !== VIEW_MODES.GRID && mode !== VIEW_MODES.ROW) return;
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore write errors
    }
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewModeState((prev) => {
      const next = prev === VIEW_MODES.GRID ? VIEW_MODES.ROW : VIEW_MODES.GRID;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore write errors
      }
      return next;
    });
  }, []);

  // Sync across tabs if changed elsewhere
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        if (event.newValue === VIEW_MODES.GRID || event.newValue === VIEW_MODES.ROW) {
          setViewModeState(event.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
    isGrid: viewMode === VIEW_MODES.GRID,
    isRow: viewMode === VIEW_MODES.ROW,
  };
}
