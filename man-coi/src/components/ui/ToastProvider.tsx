'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'badge' | 'reward' | 'milestone' | 'error';
  icon?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showBadge: (badgeName: string) => void;
  showReward: (rewardName: string) => void;
  showMilestone: (title: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

const TYPE_CONFIG = {
  info: { icon: '💫', borderColor: '#2563EB', progressColor: '#2563EB' },
  success: { icon: '✅', borderColor: '#059669', progressColor: '#059669' },
  badge: { icon: '🏅', borderColor: '#7C3AED', progressColor: '#7C3AED' },
  reward: { icon: '🎁', borderColor: '#F59E0B', progressColor: '#F59E0B' },
  milestone: { icon: '🎉', borderColor: '#F59E0B', progressColor: '#F59E0B' },
  error: { icon: '❌', borderColor: '#DC2626', progressColor: '#DC2626' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = TYPE_CONFIG[toast.type];
  const duration = toast.duration || 4000;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '14px',
        background: '#FFFFFF',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        borderLeft: `4px solid ${config.borderColor}`,
        animation: 'slideInRight 0.35s ease',
        position: 'relative',
        overflow: 'hidden',
        maxWidth: '380px',
        width: '100%',
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          background: config.progressColor,
          animation: `toastTimer ${duration}ms linear forwards`,
        }}
      />

      <span style={{ fontSize: '24px', flexShrink: 0, lineHeight: 1 }}>
        {toast.icon || config.icon}
      </span>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '2px' }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: '12px', color: '#6B7280' }}>{toast.message}</div>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9CA3AF',
          fontSize: '18px',
          lineHeight: 1,
          padding: '2px',
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const duration = toast.duration || 4000;

    setToasts(prev => [...prev.slice(-4), { ...toast, id }]);

    const timer = setTimeout(() => removeToast(id), duration + 300);
    timers.current.set(id, timer);
  }, [removeToast]);

  const showSuccess = useCallback((title: string, message?: string) =>
    showToast({ title, message, type: 'success' }), [showToast]);

  const showBadge = useCallback((badgeName: string) =>
    showToast({
      title: `🏅 Huy hiệu mới!`,
      message: `"${badgeName}" đã được mở khóa!`,
      type: 'badge',
      duration: 5000,
    }), [showToast]);

  const showReward = useCallback((rewardName: string) =>
    showToast({
      title: `🎁 Phần thưởng!`,
      message: `Bạn nhận được "${rewardName}"!`,
      type: 'reward',
      duration: 5000,
    }), [showToast]);

  const showMilestone = useCallback((title: string) =>
    showToast({
      title: `🎉 Cột mốc mới!`,
      message: title,
      type: 'milestone',
      duration: 5000,
    }), [showToast]);

  const showError = useCallback((message: string) =>
    showToast({ title: 'Có lỗi xảy ra', message, type: 'error', duration: 5000 }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showBadge, showReward, showMilestone, showError }}>
      {children}

      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes toastTimer {
            from { width: 100%; }
            to { width: 0; }
          }
        `}</style>
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'all' }}>
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
