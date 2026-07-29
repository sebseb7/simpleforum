import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';
import { createAppStore } from './store/index.js';
import theme from './theme.js';
import App from './App.jsx';
import i18n from './i18n/index.js';
import { SSG_LANG } from '@shared/ssgLang.js';

/**
 * Render the app to HTML for a URL with optional Redux prestate.
 * @returns {Promise<{ html: string, emotionCss: string }>}
 *   `emotionCss` is plain CSS text (not `<style>` tags) for a linked stylesheet.
 */
export async function render(url, preloadedState, lang = SSG_LANG) {
  await i18n.changeLanguage(lang);

  const store = createAppStore(preloadedState);
  const cache = createCache({ key: 'css' });
  const { extractCriticalToChunks } = createEmotionServer(cache);

  const html = renderToString(
    <CacheProvider value={cache}>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <StaticRouter location={url}>
              <App />
            </StaticRouter>
          </ThemeProvider>
        </I18nextProvider>
      </Provider>
    </CacheProvider>,
  );

  const emotionChunks = extractCriticalToChunks(html);
  const emotionCss = emotionChunks.styles.map((s) => s.css).join('\n');
  return { html, emotionCss };
}
