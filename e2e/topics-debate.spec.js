import { test, expect } from '@playwright/test';
import { apiRequest, fillQuill, loginAs, testLogin } from './helpers.js';

test.describe('Topics and debate', () => {
  test('user creates topic and reply; author closes and deletes', async ({ page }) => {
    const { token: adminToken } = await testLogin({
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });
    const { section } = await apiRequest(adminToken, 'POST', '/sections', {
      title: 'Open Forum',
      description: 'Anyone may start topics',
      adminOnlyTopics: false,
    });

    const { user } = await loginAs(page, {
      email: 'poster@e2e.test',
      name: 'Poster',
      isAdmin: false,
    });

    await page.goto(`/section/${section.id}`);
    await expect(page.getByRole('heading', { name: 'Open Forum' })).toBeVisible();

    await page.getByLabel('Title').fill('My Debate');
    await fillQuill(page, 'Opening statement');
    await page.getByRole('button', { name: 'Create topic' }).click();

    await expect(page.getByRole('link', { name: /My Debate/ })).toBeVisible();
    await page.getByRole('link', { name: /My Debate/ }).click();

    await expect(page.getByRole('heading', { name: 'My Debate' })).toBeVisible();
    await expect(page.getByText('Opening statement')).toBeVisible();

    await fillQuill(page, 'A thoughtful reply');
    await page.getByRole('button', { name: 'Post reply' }).click();
    await expect(page.getByText('A thoughtful reply')).toBeVisible();

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Close topic' }).click();
    await expect(page.getByText('This topic is closed.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Post reply' })).toHaveCount(0);

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL(new RegExp(`/section/${section.id}`));
    await expect(page.getByRole('link', { name: /My Debate/ })).toHaveCount(0);

    expect(user.email).toBe('poster@e2e.test');
  });

  test('admin-only section blocks non-admin topic creation but allows reply', async ({ page }) => {
    const { token: adminToken } = await testLogin({
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });
    const { section } = await apiRequest(adminToken, 'POST', '/sections', {
      title: 'Announcements',
      description: 'Admin topics only',
      adminOnlyTopics: true,
    });
    const { topic } = await apiRequest(adminToken, 'POST', `/sections/${section.id}/topics`, {
      title: 'Site Rules',
      bodyHtml: '<p>Be kind</p>',
    });

    await loginAs(page, {
      email: 'member@e2e.test',
      name: 'Member',
      isAdmin: false,
    });

    await page.goto(`/section/${section.id}`);
    await expect(
      page.getByText('Only admins can create topics in this section'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create topic' })).toHaveCount(0);

    await page.goto(`/topic/${topic.id}`);
    await fillQuill(page, 'I agree with the rules');
    await page.getByRole('button', { name: 'Post reply' }).click();
    await expect(page.getByText('I agree with the rules')).toBeVisible();
  });

  test('API rejects non-creator delete and closed replies', async ({ page: _page }) => {
    const { token: adminToken } = await testLogin({
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });
    const { section } = await apiRequest(adminToken, 'POST', '/sections', {
      title: 'Perms',
      description: 'x',
    });
    const { topic } = await apiRequest(adminToken, 'POST', `/sections/${section.id}/topics`, {
      title: 'Owned by admin',
      bodyHtml: '<p>x</p>',
    });

    const { token: userToken } = await testLogin({
      email: 'other@e2e.test',
      name: 'Other',
      isAdmin: false,
    });

    let failed = false;
    try {
      await apiRequest(userToken, 'DELETE', `/topics/${topic.id}`);
    } catch (err) {
      failed = true;
      expect(err.status).toBe(403);
    }
    expect(failed).toBe(true);

    await apiRequest(adminToken, 'PATCH', `/topics/${topic.id}/close`);
    failed = false;
    try {
      await apiRequest(userToken, 'POST', `/topics/${topic.id}/posts`, {
        bodyHtml: '<p>too late</p>',
      });
    } catch (err) {
      failed = true;
      expect(err.status).toBe(403);
    }
    expect(failed).toBe(true);
  });
});
