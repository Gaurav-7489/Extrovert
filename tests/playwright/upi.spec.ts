import { expect, test } from '@playwright/test';

test.describe('UPI handoff', () => {
  test('UPI schemes are not trapped inside the web app', async ({ page }) => {
    await page.goto('/login');

    const links = await page.locator('a[href^="upi://"], a[href^="intent://"]').evaluateAll((els) =>
      els.map((el) => ({ href: (el as HTMLAnchorElement).href, text: el.textContent?.trim() ?? '' }))
    );

    for (const link of links) {
      expect(link.href).toMatch(/^(upi|intent):\/\//);
    }
  });
});
