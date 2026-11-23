import { useState, useEffect } from 'react';
import { formatTranslation } from '../lib/translations';

export function useRelativeTime(date, lang = 'en', tickMs = 5000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  if (!date) return null;

  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 5) return formatTranslation(lang, 'justNow');
  if (seconds < 60) return formatTranslation(lang, 'secondsAgo', { n: seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return formatTranslation(lang, 'minutesAgo', { n: minutes });
  return formatTranslation(lang, 'hoursAgo', { n: Math.floor(minutes / 60) });
}

