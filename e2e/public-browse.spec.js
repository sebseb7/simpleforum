import { test, expect } from './fixtures.js';
import { apiRequest, testLogin } from './helpers.js';

test.describe('Public browse (anonymous)', () => {
  test('home shows brand and sections list', async ({ page }) => {
    const { token } = await testLogin({
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });
    await apiRequest(token, 'POST', '/sections', {
      title: 'Public Square',
      description: 'Open for all',
      adminOnlyTopics: false,
    });

    await page.goto('/');
    await expect(page.getByRole('link', { name: /Public Square/ })).toBeVisible();
  });

  test('anonymous can open section and topic via URL router', async ({ page }) => {
    const { token } = await testLogin({
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });
    const { section } = await apiRequest(token, 'POST', '/sections', {
      title: 'Browse Section',
      description: 'Readable',
    });
    const { topic } = await apiRequest(token, 'POST', `/sections/${section.id}/topics`, {
      title: 'Readable Topic',
      bodyHtml: '<p>Hello world</p>',
    });
    await apiRequest(token, 'POST', `/topics/${topic.id}/posts`, {
      bodyHtml: '<p>First reply</p>',
    });

    await page.goto(`/section/${section.slug}`);
    await expect(page.getByRole('heading', { name: 'Browse Section' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Readable Topic/ })).toBeVisible();
    await expect(page).toHaveTitle(/Browse Section/);

    await page.goto(`/topic/${topic.slug}`);
    await expect(page.getByRole('heading', { name: 'Readable Topic' })).toBeVisible();
    await expect(page.getByText('Hello world')).toBeVisible();
    await expect(page.getByText('First reply')).toBeVisible();
    await expect(page.getByText('Sign in to participate.')).toBeVisible();
    await expect(page).toHaveTitle(/Readable Topic/);
    await expect(page).toHaveURL(new RegExp(`/topic/${topic.slug}`));
  });

  test('starred page is reachable and prompts login', async ({ page }) => {
    await page.goto('/starred');
    await expect(page.getByRole('heading', { name: 'Starred' })).toBeVisible();
    await expect(page.getByText(/Sign in to see your starred/i)).toBeVisible();
  });
});
