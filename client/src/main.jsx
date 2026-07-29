import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { I18nextProvider } from 'react-i18next';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import './fonts.css';
import store from './store/index.js';
import theme from './theme.js';
import App from './App.jsx';
import i18n from './i18n/index.js';
import { startSse } from './sse.js';
import { hydrateAuth } from './store/authSlice.js';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

store.dispatch(hydrateAuth());
startSse(store);

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <GoogleOAuthProvider clientId={clientId}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </GoogleOAuthProvider>
    </I18nextProvider>
  </Provider>,
);
