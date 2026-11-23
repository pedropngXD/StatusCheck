import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../lib/translations';

export default function MobileSettingsSheet({
  isOpen,
  onClose,
  refreshing,
  onRefresh,
  isMuted,
  onToggleMute,
  activeIncidentCount = 0,
  onOpenFeed,
  theme = 'light',
  onToggleTheme,
}) {
  const { lang, setLang, t } = useLanguage();
  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(null);
  const backdropRef = useRef(null);

  const handleClose = useCallback(() => {
    setDragY(0);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 100) {
      handleClose();
    } else {
      setDragY(0);
    }
    touchStartY.current = null;
  };

  useEffect(() => {
    if (!isOpen) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen && !isClosing) return null;

  const isDark = theme === 'dark';

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 bg-black/55 backdrop-blur-[4px] z-[1000] flex items-end justify-center overscroll-contain ${
        isClosing ? 'animate-[modal-fade-out_0.2s_ease-out_forwards]' : 'animate-[modal-fade-in_0.15s_ease-out]'
      }`}
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('settings')}
    >
      <div
        className={`bg-[var(--bg-card)] border-t border-[var(--border-card)] w-full rounded-t-[20px] flex flex-col max-h-[85dvh] shadow-[0_-8px_32px_rgba(0,0,0,0.28)] relative ${
          isClosing
            ? 'animate-[modal-sheet-slide-down_0.2s_ease-out_forwards]'
            : 'animate-[modal-sheet-slide-up_0.24s_ease-out]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: dragY > 0 && !isClosing ? `translateY(${dragY}px)` : '',
          transition: dragY === 0 || isClosing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        <div
          className="flex items-center justify-center pt-3 pb-1 shrink-0 touch-none"
          aria-hidden="true"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-9 h-[5px] rounded-[3px] bg-[rgba(142,142,147,0.35)] pointer-events-none" />
        </div>

        <div
          className="px-5 pt-2 pb-4 border-b border-[var(--border-subtle)] shrink-0 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <h2 className="text-[1.125rem] font-bold text-[var(--text-primary)] m-0">
            {t('settings')}
          </h2>
        </div>

        <div className="p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,12px))] flex flex-col gap-2.5 overflow-y-auto overscroll-contain">
          {/* Feed / Timeline */}
          <button
            type="button"
            onClick={() => {
              handleClose();
              setTimeout(() => onOpenFeed(), 150);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(142,142,147,0.06)] text-[var(--text-primary)] text-[0.9rem] font-medium active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <svg className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span className="truncate">{t('incidentFeed')}</span>
            </div>
            {activeIncidentCount > 0 ? (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[var(--status-outage)] text-white text-xs font-bold font-mono">
                {activeIncidentCount}
              </span>
            ) : (
              <span className="text-xs text-[var(--text-secondary)]">0</span>
            )}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => {
              onRefresh();
              handleClose();
            }}
            disabled={refreshing}
            className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(142,142,147,0.06)] text-[var(--text-primary)] text-[0.9rem] font-medium active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <svg
                className={`w-4 h-4 shrink-0 text-[var(--text-secondary)] ${refreshing ? 'animate-[spin_0.8s_linear_infinite]' : ''}`}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1.5 8a6.5 6.5 0 0 1 11.23-4.46L14.5 5" />
                <path d="M14.5 1.5v3.5h-3.5" />
                <path d="M14.5 8a6.5 6.5 0 0 1-11.23 4.46L1.5 11" />
                <path d="M1.5 14.5V11h3.5" />
              </svg>
              <span>{refreshing ? t('checking') : t('refresh')}</span>
            </div>
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={onToggleMute}
            className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(142,142,147,0.06)] text-[var(--text-primary)] text-[0.9rem] font-medium active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {isMuted ? (
                <svg className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
                  <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
                  <path d="M18 8a6 6 0 0 0-9.33-5" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              )}
              <span>{t('notifications')}</span>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isMuted
                  ? 'bg-[rgba(142,142,147,0.16)] text-[var(--text-secondary)]'
                  : 'bg-[var(--status-operational-bg)] text-[var(--status-operational)]'
              }`}
            >
              {isMuted ? t('muted') : t('alertsOn')}
            </span>
          </button>

          {/* Language */}
          <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(142,142,147,0.06)]">
            <div className="flex items-center gap-3 text-[var(--text-primary)] text-[0.9rem] font-medium">
              <svg className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{t('language')}</span>
            </div>

            <div className="inline-flex bg-[rgba(142,142,147,0.14)] p-0.5 rounded-[var(--radius-sm)] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-[calc(var(--radius-sm)-2px)] transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('pt-BR')}
                className={`px-2.5 py-1 rounded-[calc(var(--radius-sm)-2px)] transition-colors cursor-pointer ${
                  lang === 'pt-BR'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Português
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(142,142,147,0.06)]">
            <div className="flex items-center gap-3 text-[var(--text-primary)] text-[0.9rem] font-medium">
              {isDark ? (
                <svg className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
              <span>{t('theme')}</span>
            </div>

            <div className="inline-flex bg-[rgba(142,142,147,0.14)] p-0.5 rounded-[var(--radius-sm)] text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  if (isDark) onToggleTheme();
                }}
                className={`px-2.5 py-1 rounded-[calc(var(--radius-sm)-2px)] transition-colors cursor-pointer ${
                  !isDark
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {t('light')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isDark) onToggleTheme();
                }}
                className={`px-2.5 py-1 rounded-[calc(var(--radius-sm)-2px)] transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {t('dark')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
