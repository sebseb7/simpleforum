import { test, expect } from '@playwright/test';
import { apiRequest, loginAs, testLogin } from './helpers.js';
import { API_URL } from './env.js';

test.describe('Live SSE updates', () => {
  test('section list updates when another client creates a section', async ({ page }) => {
    await loginAs(page, {
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

    const { token } = await testLogin({
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });

    await page.waitForTimeout(500);

    await apiRequest(token, 'POST', '/sections', {
      title: 'SSE Appeared',
      description: 'Created remotely',
    });

    await expect(page.getByRole('link', { name: /SSE Appeared/ })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('SSE endpoint streams events', async () => {
    const res = await fetch(`${API_URL}/api/events`);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const reader = res.body.getReader();
    const { value } = await reader.read();
    const chunk = new TextDecoder().decode(value);
    expect(chunk).toContain('connected');
    await reader.cancel();
  });
});
