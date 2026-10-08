import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'statuscheck_view_mode';
export const VIEW_MODES = {
  GRID: 'grid',
  ROW: 'row',
};

export function useViewMode(defaultMode = VIEW_MODES.ROW) {
  const [viewMode, setViewModeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === VIEW_MODES.GRID || saved === VIEW_MODES.ROW) {
        return saved;
      }
    } catch {}
    return defaultMode;
  });

  const setViewMode = useCallback((mode) => {
    if (mode !== VIEW_MODES.GRID && mode !== VIEW_MODES.ROW) return;
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewModeState((prev) => {
      const next = prev === VIEW_MODES.GRID ? VIEW_MODES.ROW : VIEW_MODES.GRID;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

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
