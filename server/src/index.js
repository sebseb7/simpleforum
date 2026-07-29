import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { openDatabase } from './db.js';
import createGoogleAuthRouter from './api/auth/google.js';
import createTestLoginRouter from './api/auth/testLogin.js';
import createMeRouter from './api/me.js';
import createSectionsRouter from './api/sections.js';
import createTopicsRouter from './api/topics.js';
import createPostsRouter from './api/posts.js';
import createStarsRouter from './api/stars.js';
import createEventsRouter from './api/events.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
// Drop empty process env values so .env can fill them, but keep non-empty
// values (e.g. Playwright webServer PORT / E2E_AUTH_SECRET) preferred.
for (const key of Object.keys(process.env)) {
  if (process.env[key] === '') delete process.env[key];
}
dotenv.config({ path: envPath, quiet: true });

const port = Number(process.env.PORT) || 3001;
const store = openDatabase(process.env.DATABASE_PATH || './server/data/romanum.sqlite');

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - started}ms)`);
  });
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    googleClientIdConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
  });
});

app.use('/api/auth', createGoogleAuthRouter(store));
app.use('/api/auth', createTestLoginRouter(store));
app.use('/api', createMeRouter(store));
app.use('/api', createSectionsRouter(store));
app.use('/api', createTopicsRouter(store));
app.use('/api', createPostsRouter(store));
app.use('/api', createStarsRouter(store));
app.use('/api', createEventsRouter());

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Romanum API listening on http://127.0.0.1:${port}`);
  console.log(`Loaded .env from ${envPath}`);
  console.log(
    `GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'configured' : 'MISSING'}`,
  );
});
