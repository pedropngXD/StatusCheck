import { useEffect, useRef, useState } from 'react';
import { STATUS_PROVIDERS } from '../lib/statusProviders';

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
  const [notifications, setNotifications] = useState([]);
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
      if (!newVal && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
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
    let newNotifications = [];

    selectedServiceIds.forEach(id => {
      const oldData = previous[id]?.data;
      const newData = statuses[id]?.data;

      // Only notify if we transition from one valid status to another
      if (oldData && newData && oldData.status && newData.status && oldData.status !== newData.status) {
        const provider = STATUS_PROVIDERS.find(p => p.id === id);
        if (provider) {
          const notifId = Date.now() + '-' + id;
          newNotifications.push({
            id: notifId,
            serviceName: provider.name,
            oldStatus: oldData.status,
            newStatus: newData.status,
            timestamp: new Date()
          });

          if (!isMuted && 'Notification' in window && Notification.permission === 'granted') {
             new Notification(`Status Change: ${provider.name}`, {
               body: `Status changed from ${oldData.status} to ${newData.status}`
             });
          }
        }
      }
    });

    if (newNotifications.length > 0) {
      if (!isMuted) {
        playNotificationSound();
      }

      setNotifications(prev => {
        const updated = [...prev, ...newNotifications].slice(-5);
        return updated;
      });

      // Auto-dismiss after 6 seconds
      newNotifications.forEach(n => {
        setTimeout(() => {
          setNotifications(prev => prev.filter(x => x.id !== n.id));
        }, 6000);
      });
    }

    previousStatusesRef.current = statuses;
  }, [statuses, selectedServiceIds, isMuted]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, dismissNotification, isMuted, toggleMute };
}

