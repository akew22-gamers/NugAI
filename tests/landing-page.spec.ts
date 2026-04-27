import { test, expect } from '@playwright/test';

test('take screenshot of landing page on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000');
  await page.screenshot({ path: 'landing-page-mobile.png' });
});