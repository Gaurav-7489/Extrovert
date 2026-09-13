import { expect, test } from '@playwright/test';

for (const route of ['/login', '/about', '/privacy', '/terms', '/safety']) {
  test(`mobile regression: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();

    await expect(page.locator('body')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      width: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      height: document.body.scrollHeight,
    }));

    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.width + 1);
    expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.width + 1);
    expect(dimensions.height).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}
