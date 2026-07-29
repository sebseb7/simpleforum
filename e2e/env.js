export const PORT = process.env.E2E_PORT || '3101';
export const CLIENT_PORT = process.env.E2E_CLIENT_PORT || '5273';
export const BASE_URL = `http://127.0.0.1:${CLIENT_PORT}`;
export const API_URL = `http://127.0.0.1:${PORT}`;

const runId = process.env.E2E_RUN_ID || String(Date.now());

export const e2eEnv = {
  PORT,
  DATABASE_PATH: `./server/data/romanum-e2e-${runId}.sqlite`,
  JWT_SECRET: 'e2e-jwt-secret',
  JWT_EXPIRES_IN: '1d',
  ADMIN_EMAILS: 'admin@e2e.test',
  CLIENT_ORIGIN: BASE_URL,
  E2E_AUTH_SECRET: 'e2e-secret',
  GOOGLE_CLIENT_ID: '',
  VITE_GOOGLE_CLIENT_ID: '',
};
