import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'statuscheck_history_v1';
const HOUR_MS = 60 * 60 * 1000;
export const HISTORY_HOURS = 24;

const RANK = { operational: 0, degraded: 1, outage: 2 };
const RANK_TO_STATUS = ['operational', 'degraded', 'outage'];

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Registra, a cada ciclo de telemetria, o pior status de cada serviço por hora
 * (últimas 24h) no localStorage e expõe `getBars(id)` com 24 posições
 * (da mais antiga para a mais recente). Horas sem registro retornam `null`.
 */
export function useStatusHistory(statuses, lastCycleAt) {
  const [history, setHistory] = useState(loadHistory);
  const statusesRef = useRef(statuses);

  useEffect(() => {
    statusesRef.current = statuses;
  }, [statuses]);

  useEffect(() => {
    if (!lastCycleAt) return;

    const bucket = Math.floor(lastCycleAt.getTime() / HOUR_MS);
    const oldest = bucket - (HISTORY_HOURS - 1);

    setHistory((prev) => {
      const next = {};

      Object.keys({ ...prev, ...statusesRef.current }).forEach((id) => {
        const kept = {};
        Object.entries(prev[id] || {}).forEach(([key, rank]) => {
          if (Number(key) >= oldest) kept[key] = rank;
        });

        const rank = RANK[statusesRef.current[id]?.data?.status];
        if (rank !== undefined) {
          kept[bucket] = Math.max(kept[bucket] ?? 0, rank);
        }

        if (Object.keys(kept).length > 0) next[id] = kept;
      });

      return next;
    });
  }, [lastCycleAt]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {}
  }, [history]);

  const getBars = useCallback(
    (id) => {
      if (!lastCycleAt) return Array(HISTORY_HOURS).fill(null);

      const bucket = Math.floor(lastCycleAt.getTime() / HOUR_MS);
      return Array.from({ length: HISTORY_HOURS }, (_, index) => {
        const rank = history[id]?.[bucket - (HISTORY_HOURS - 1 - index)];
        return rank === undefined ? null : RANK_TO_STATUS[rank];
      });
    },
    [history, lastCycleAt]
  );

  return { getBars };
}

