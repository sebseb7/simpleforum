import { test, expect } from './fixtures.js';
import { apiRequest, loginAs, testLogin } from './helpers.js';

test.describe('Stars', () => {
  test('starred topics and posts appear on /starred', async ({ page }) => {
    const { token: adminToken } = await testLogin({
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });
    const { section } = await apiRequest(adminToken, 'POST', '/sections', {
      title: 'Star Section',
      description: 'for starring',
    });
    const { topic } = await apiRequest(adminToken, 'POST', `/sections/${section.id}/topics`, {
      title: 'Starworthy Topic',
      bodyHtml: '<p>Shine</p>',
    });
    const { post } = await apiRequest(adminToken, 'POST', `/topics/${topic.id}/posts`, {
      bodyHtml: '<p>Star this post too</p>',
    });

    const { token: fanToken } = await loginAs(page, {
      email: 'fan@e2e.test',
      name: 'Fan',
      isAdmin: false,
    });

    await apiRequest(fanToken, 'POST', '/stars', {
      targetType: 'topic',
      targetId: topic.id,
    });
    await apiRequest(fanToken, 'POST', '/stars', {
      targetType: 'post',
      targetId: post.id,
    });

    await page.goto(`/topic/${topic.slug}`);
    await expect(page.getByRole('heading', { name: 'Starworthy Topic' })).toBeVisible();

    await page.goto('/starred');
    await expect(page.getByRole('heading', { name: 'Starred' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Starworthy Topic/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Post by Admin/ })).toBeVisible();

    await apiRequest(fanToken, 'DELETE', '/stars', {
      targetType: 'topic',
      targetId: topic.id,
    });
    await page.reload();
    await expect(page.getByRole('link', { name: /Starworthy Topic/ })).toHaveCount(0);
  });

  test('anonymous cannot star (UI disabled) and API rejects', async ({ page }) => {
    const { token: adminToken } = await testLogin({
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });
    const { section } = await apiRequest(adminToken, 'POST', '/sections', {
      title: 'Anon Stars',
      description: 'x',
    });
    const { topic } = await apiRequest(adminToken, 'POST', `/sections/${section.id}/topics`, {
      title: 'No Star Yet',
      bodyHtml: '<p>x</p>',
    });

    await page.goto(`/topic/${topic.slug}`);
    await expect(page.getByRole('button', { name: 'Sign in to star' }).first()).toBeDisabled();

    let rejected = false;
    try {
      await apiRequest(null, 'POST', '/stars', {
        targetType: 'topic',
        targetId: topic.id,
      });
    } catch (err) {
      rejected = true;
      expect(err.status).toBe(401);
    }
    expect(rejected).toBe(true);
  });
});
