import { test, expect } from '@playwright/test';
import { loginAs } from './helpers.js';

test.describe('Admin sections', () => {
  test('admin can create and edit a section in the UI', async ({ page }) => {
    await loginAs(page, {
      email: 'admin@e2e.test',
      name: 'Admin',
      isAdmin: true,
    });

    await page.goto('/admin/sections');
    await expect(page.getByRole('heading', { name: 'Manage sections' })).toBeVisible();

    await page.getByLabel('Title').fill('Debate Hall');
    await page.getByLabel('Description').fill('Main open section');
    await page.getByRole('button', { name: 'Create section' }).click();

    await expect(page.getByText('Debate Hall')).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByLabel('Title').fill('Debate Hall Updated');
    await page.getByRole('button', { name: 'Update section' }).click();
    await expect(page.getByText('Debate Hall Updated')).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('link', { name: /Debate Hall Updated/ })).toBeVisible();
  });

  test('non-admin cannot manage sections', async ({ page }) => {
    await loginAs(page, {
      email: 'user@e2e.test',
      name: 'Regular User',
      isAdmin: false,
    });

    await page.goto('/admin/sections');
    await expect(page.getByText('Admin access required.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
  });
});
