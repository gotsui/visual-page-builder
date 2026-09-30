import { test, expect } from '@playwright/test';

test('トップページが表示される', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Create Next App/i);
  await page.screenshot({ path: './screenshots/example.png', fullPage: true });
});