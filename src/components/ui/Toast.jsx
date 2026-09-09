/* eslint-disable react-refresh/only-export-components -- ToastProvider and useToast belong together;
   splitting them would spread one concern across two files. */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, tone = 'success') => {
    const id = ++seq.current;
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 4000);
  }, [dismiss]);

  const value = useMemo(() => ({
    toast: (m) => push(m, 'success'),
    toastError: (m) => push(m, 'error'),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.tone === 'error' ? ' toast-error' : ''}`}>
            <span className="toast-bar" aria-hidden="true" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}