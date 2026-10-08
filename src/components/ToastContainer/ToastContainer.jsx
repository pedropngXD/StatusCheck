import React from 'react';

export default function ToastContainer({ notifications, onDismiss }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-[320px] w-full pointer-events-none">
      {notifications.map(n => {
        // Simple color logic based on new status
        let statusColorClass = 'text-[var(--text-secondary)]';
        let bgLineClass = 'bg-[var(--border-subtle)]';

        if (n.newStatus === 'operational') {
          statusColorClass = 'text-[var(--status-operational)]';
          bgLineClass = 'bg-[var(--status-operational)]';
        } else if (n.newStatus === 'degraded' || n.newStatus === 'maintenance') {
          statusColorClass = 'text-[var(--status-degraded)]';
          bgLineClass = 'bg-[var(--status-degraded)]';
        } else if (n.newStatus === 'outage') {
          statusColorClass = 'text-[var(--status-outage)]';
          bgLineClass = 'bg-[var(--status-outage)]';
        }

        return (
          <div 
            key={n.id} 
            className="pointer-events-auto bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-lg p-4 flex flex-col gap-1 relative overflow-hidden transition-all animate-[slide-up_0.3s_ease-out]"
            style={{ animation: 'slide-up 0.3s ease-out' }}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${bgLineClass}`} />
            
            <button 
              onClick={() => onDismiss(n.id)}
              className="absolute top-3 right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              aria-label="Dismiss notification"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <div className="text-sm font-semibold text-[var(--text-primary)] pr-6">{n.serviceName} Status</div>
            <div className="text-[0.8125rem] text-[var(--text-secondary)] mt-0.5">
              Changed from <span className="font-medium capitalize">{n.oldStatus}</span> to <span className={`font-medium capitalize ${statusColorClass}`}>{n.newStatus}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

