import { useEffect, useRef, useState } from 'react';
import { STATUS_PROVIDERS } from '../lib/statusProviders';
import { getLogoUrl } from '../assets/logos';

function getStatusEmoji(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('operational') || s === 'up' || s === 'resolved') return '✅';
  if (s.includes('degraded') || s.includes('partial') || s.includes('maintenance')) return '⚠️';
  if (s.includes('outage') || s.includes('major') || s === 'down') return '🚨';
  return 'ℹ️';
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Ignore if audio not supported or blocked
  }
}

export function useStatusNotifications(statuses, selectedServiceIds) {
  const previousStatusesRef = useRef(statuses);
  const isFirstRender = useRef(true);

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('statuscheck_notifications_muted') === 'true';
    }
    return false;
  });

  const toggleMute = () => {
    setIsMuted(prev => {
      const newVal = !prev;
      localStorage.setItem('statuscheck_notifications_muted', String(newVal));
      
      // Request native notification permission if unmuting and haven't asked yet
      if (!newVal && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        } else if (Notification.permission === 'granted') {
          // Fire a native test notification to show it's working
          new Notification('🔔 Notificações Ativadas', {
            body: 'O som e os alertas push estão funcionando perfeitamente!'
          });
          playNotificationSound();
        }
      }

      return newVal;
    });
  };

  // Request native notification permission on mount if not muted
  useEffect(() => {
    if (!isMuted && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isMuted]);

  useEffect(() => {
    if (isFirstRender.current) {
      previousStatusesRef.current = statuses;
      isFirstRender.current = false;
      return;
    }

    const previous = previousStatusesRef.current;
    let didNotify = false;

    selectedServiceIds.forEach(id => {
      const oldData = previous[id]?.data;
      const newData = statuses[id]?.data;

      // Only notify if we transition from one valid status to another
      if (oldData && newData && oldData.status && newData.status && oldData.status !== newData.status) {
        const provider = STATUS_PROVIDERS.find(p => p.id === id);
        if (provider) {
          if (!isMuted && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
             const logoUrl = getLogoUrl(provider.logo);
             const iconUrl = logoUrl ? new URL(logoUrl, window.location.origin).href : undefined;
             const emoji = getStatusEmoji(newData.status);
             const oldStatusText = oldData.status.replace(/_/g, ' ').toUpperCase();
             const newStatusText = newData.status.replace(/_/g, ' ').toUpperCase();

             new Notification(`${emoji} Status Alterado: ${provider.name}`, {
               body: `O status mudou de ${oldStatusText} para ${newStatusText}`,
               icon: iconUrl
             });
             didNotify = true;
          }
        }
      }
    });

    if (didNotify) {
      playNotificationSound();
    }

    previousStatusesRef.current = statuses;
  }, [statuses, selectedServiceIds, isMuted]);

  return { isMuted, toggleMute };
}

