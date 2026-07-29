import { test as base, expect } from '@playwright/test';

/** Force English UI so assertions and screenshots stay stable. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('romanum_lang', 'en');
    });
    await use(page);
  },
});

export { expect };
