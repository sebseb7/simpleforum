import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { I18nextProvider } from 'react-i18next';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import './fonts.css';
import { createAppStore } from './store/index.js';
import theme from './theme.js';
import App from './App.jsx';
import i18n, { setStoredLang } from './i18n/index.js';
import { startSse } from './sse.js';
import { hydrateAuth } from './store/authSlice.js';
import { getStoredToken, getStoredUser } from './api.js';
import { SSG_LANG } from '@shared/ssgLang.js';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const emotionCache = createCache({ key: 'css' });

function buildClientPreloadedState() {
  const raw = typeof window !== 'undefined' ? window.__PRELOADED_STATE__ : null;
  if (!raw || typeof raw !== 'object') return undefined;
  const token = getStoredToken();
  return {
    ...raw,
    auth: {
      token,
      user: token ? getStoredUser() : null,
      status: token ? 'loading' : 'idle',
      error: null,
    },
  };
}

async function boot() {
  const preloaded = buildClientPreloadedState();
  const ssgLang =
    (typeof window !== 'undefined' && window.__SSG_LANG__) ||
    (preloaded ? SSG_LANG : null);

  // Match prerendered UI strings / dates before the first React paint.
  if (ssgLang && preloaded) {
    setStoredLang(ssgLang);
    await i18n.changeLanguage(ssgLang);
  }

  const store = createAppStore(preloaded);

  store.dispatch(hydrateAuth());
  startSse(store);

  const tree = (
    <CacheProvider value={emotionCache}>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <GoogleOAuthProvider clientId={clientId}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </ThemeProvider>
          </GoogleOAuthProvider>
        </I18nextProvider>
      </Provider>
    </CacheProvider>
  );

  const rootEl = document.getElementById('root');
  if (preloaded && rootEl && rootEl.hasChildNodes()) {
    hydrateRoot(rootEl, tree);
  } else {
    createRoot(rootEl).render(tree);
  }
}

boot();
