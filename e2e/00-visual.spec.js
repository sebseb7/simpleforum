import { test, expect } from './fixtures.js';
import { apiRequest, loginAs, testLogin } from './helpers.js';

/**
 * Visual baselines are stored under e2e/screenshots/ and committed to git.
 * Update with: npm run test:e2e:update-snapshots
 */
test.describe('Visual baselines', () => {
  test.beforeAll(async () => {
    const { token } = await testLogin({
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });
    const { section } = await apiRequest(token, 'POST', '/sections', {
      title: 'Visual Hall',
      description: 'Baseline section for screenshots',
      adminOnlyTopics: false,
      sortOrder: 0,
    });
    await apiRequest(token, 'POST', '/sections', {
      title: 'Admin Notices',
      description: 'Admin-only topic creation',
      adminOnlyTopics: true,
      sortOrder: 1,
    });
    const { topic } = await apiRequest(token, 'POST', `/sections/${section.id}/topics`, {
      title: 'Baseline Topic',
      bodyHtml: '<p>Stable body for visual comparison.</p>',
    });
    await apiRequest(token, 'POST', `/topics/${topic.id}/posts`, {
      bodyHtml: '<p>Stable reply for visual comparison.</p>',
    });
  });

  test('anonymous home', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Visual Hall/ })).toBeVisible();
    await expect(page).toHaveScreenshot('home-anonymous.png', { fullPage: true });
  });

  test('anonymous section', async ({ page }) => {
    const { sections } = await apiRequest(null, 'GET', '/sections');
    const section = sections.find((s) => s.title === 'Visual Hall');
    expect(section).toBeTruthy();

    await page.goto(`/section/${section.slug}`);
    await expect(page.getByRole('heading', { name: 'Visual Hall' })).toBeVisible();
    await expect(page).toHaveScreenshot('section-anonymous.png', { fullPage: true });
  });

  test('anonymous topic', async ({ page }) => {
    const { sections } = await apiRequest(null, 'GET', '/sections');
    const section = sections.find((s) => s.title === 'Visual Hall');
    const { topics } = await apiRequest(null, 'GET', `/sections/${section.slug}/topics`);
    const topic = topics.find((t) => t.title === 'Baseline Topic');

    await page.goto(`/topic/${topic.slug}`);
    await expect(page.getByRole('heading', { name: 'Baseline Topic' })).toBeVisible();
    await expect(page).toHaveScreenshot('topic-anonymous.png', { fullPage: true });
  });

  test('admin sections page', async ({ page }) => {
    await loginAs(page, {
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });
    await page.goto('/admin/sections');
    await expect(page.getByRole('heading', { name: 'Manage sections' })).toBeVisible();
    await expect(page).toHaveScreenshot('admin-sections.png', { fullPage: true });
  });

  test('starred empty for logged-in user', async ({ page }) => {
    await loginAs(page, {
      email: 'viewer@e2e.test',
      name: 'Viewer',
      isAdmin: false,
    });
    await page.goto('/starred');
    await expect(page.getByRole('heading', { name: 'Starred' })).toBeVisible();
    await expect(page).toHaveScreenshot('starred-empty.png', { fullPage: true });
  });
});
