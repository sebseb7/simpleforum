import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import store from './store/index.js';
import theme from './theme.js';
import App from './App.jsx';
import { startSse } from './sse.js';
import { hydrateAuth } from './store/authSlice.js';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

store.dispatch(hydrateAuth());
startSse(store);

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </Provider>,
);
