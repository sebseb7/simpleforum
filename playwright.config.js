import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, API_URL, CLIENT_PORT, PORT, e2eEnv } from './e2e/env.js';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  // Committed visual baselines (comparative testing)
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  snapshotDir: './e2e/screenshots',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
  globalSetup: './e2e/global-setup.js',
  webServer: [
    {
      command: 'node server/src/index.js',
      url: `${API_URL}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { ...process.env, ...e2eEnv },
    },
    {
      command: `npx vite --host 127.0.0.1 --port ${CLIENT_PORT}`,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        ...e2eEnv,
        PORT,
      },
    },
  ],
});
