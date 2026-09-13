import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { registerServiceWorker } from './lib/pwa';
import { initNative } from './lib/native';
import './styles/base.css';
import './styles/components.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

/**
 * An installed app has no reload button, so a new build would otherwise never
 * reach someone who keeps it open. The banner is appended to the document
 * rather than rendered by React: the update can land before, during or after a
 * render, and a plain element sidesteps that entirely.
 */
registerServiceWorker((applyUpdate) => {
  if (document.querySelector('.sw-update')) return;

  const bar = document.createElement('div');
  bar.className = 'sw-update';
  bar.innerHTML =
    '<span>A new version of NaijaNest is ready.</span>' +
    '<button type="button">Update</button>';
  bar.querySelector('button').addEventListener('click', applyUpdate);
  document.body.appendChild(bar);
});

/**
 * Native shell setup. A no-op in a browser, so this file stays the single
 * entry point for all three containers.
 *
 * The deep link handler uses history.pushState rather than a full navigation:
 * a password-reset link carries its token in the URL fragment, and reloading
 * the document would discard it before Supabase could read it.
 */
initNative({
  onDeepLink: (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
});
