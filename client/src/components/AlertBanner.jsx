// client/src/components/AlertBanner.jsx
// Real-time dismissible alert banner — powered by Supabase Realtime.
// When an admin posts or updates an alert, ALL visitors see it instantly
// without refreshing the page.

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaInfoCircle, FaExclamationTriangle, FaTimesCircle, FaCheckCircle, FaBell } from 'react-icons/fa';
import { supabase } from '../lib/supabase';

const TYPE_STYLES = {
  info:    { bg: 'bg-blue-500',   text: 'text-white', icon: FaInfoCircle,         border: 'border-blue-400' },
  warning: { bg: 'bg-amber-500',  text: 'text-white', icon: FaExclamationTriangle, border: 'border-amber-400' },
  danger:  { bg: 'bg-red-600',    text: 'text-white', icon: FaTimesCircle,         border: 'border-red-500' },
  success: { bg: 'bg-emerald-500',text: 'text-white', icon: FaCheckCircle,         border: 'border-emerald-400' },
};

export default function AlertBanner() {
  const [alerts, setAlerts]       = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissed_alerts') || '[]'); }
    catch { return []; }
  });

  // Fetch initial active alerts
  const fetchAlerts = useCallback(async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('id, title, message, type, active, expires_at')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const now = new Date();
      setAlerts(
        data.filter(a => !a.expires_at || new Date(a.expires_at) > now)
      );
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to Realtime changes on the alerts table
    const channel = supabase
      .channel('public:alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const a = payload.new;
            if (a.active && (!a.expires_at || new Date(a.expires_at) > new Date())) {
              setAlerts(prev => [a, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const a = payload.new;
            setAlerts(prev => {
              const filtered = prev.filter(x => x.id !== a.id);
              if (a.active && (!a.expires_at || new Date(a.expires_at) > new Date())) {
                return [a, ...filtered];
              }
              return filtered;
            });
          } else if (payload.eventType === 'DELETE') {
            setAlerts(prev => prev.filter(x => x.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAlerts]);

  // Dismiss an alert for this session
  const dismiss = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    try { sessionStorage.setItem('dismissed_alerts', JSON.stringify(updated)); } catch {}
  };

  const visible = alerts.filter(a => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="fixed top-16 md:top-20 left-0 right-0 z-30 px-4 pt-2 space-y-2 pointer-events-none">
      <AnimatePresence>
        {visible.map((alert) => {
          const style = TYPE_STYLES[alert.type] || TYPE_STYLES.info;
          const Icon  = style.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,   scale: 1 }}
              exit={{    opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className={`
                pointer-events-auto max-w-4xl mx-auto
                ${style.bg} ${style.text}
                rounded-2xl shadow-2xl border ${style.border} border-opacity-40
                flex items-start gap-3 px-5 py-3.5
              `}
              role="alert"
            >
              {/* Icon */}
              <Icon className="flex-shrink-0 text-xl mt-0.5 opacity-90" />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {alert.title && (
                  <span className="font-bold mr-2">{alert.title}:</span>
                )}
                <span className="text-sm leading-relaxed">{alert.message}</span>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => dismiss(alert.id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Dismiss alert"
              >
                <FaTimes className="text-sm" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
