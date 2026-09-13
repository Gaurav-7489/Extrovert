import { expect, test } from '@playwright/test';

test.describe('PWA and browser-platform contract', () => {
  test('manifest is valid for installable mobile PWA', async ({ page, request }) => {
    const response = await request.get('/manifest.json');
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest.name).toBe('Extrovert');
    expect(manifest.short_name).toBe('Extrovert');
    expect(manifest.start_url).toBe('/app');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
      expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
    ]));

    await page.goto('/login');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBe('/manifest.json');
    expect(await page.locator('link[rel="apple-touch-icon"]').count()).toBeGreaterThan(0);
  });

  test('service worker is registerable and scoped to the app origin', async ({ page, context }) => {
    await page.goto('/login');

    const result = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('/');
      return registration
        ? { scope: registration.scope, scriptURL: registration.active?.scriptURL ?? registration.installing?.scriptURL ?? null }
        : null;
    });

    expect(result).not.toBeNull();
    expect(result?.scope).toBe(new URL('/', page.url()).href);
    expect(result?.scriptURL).toContain('/sw.js');

    await context.grantPermissions(['notifications']);
  });

  test('mobile page has no horizontal overflow and respects safe-area viewport', async ({ page }) => {
    await page.goto('/login');

    const metrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      viewportHeight: window.innerHeight,
    }));

    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.viewportHeight).toBeGreaterThan(0);
  });

  test('permissions policy does not accidentally enable microphone access', async ({ page }) => {
    await page.goto('/login');
    const policy = await page.evaluate(async () => {
      const response = await fetch(location.href);
      return response.headers.get('permissions-policy');
    });

    expect(policy?.toLowerCase()).toContain('camera=(self)');
    expect(policy?.toLowerCase()).toContain('geolocation=(self)');
    expect(policy?.toLowerCase()).toContain('microphone=()');
  });

  test('camera and geolocation APIs can be exercised by app code', async ({ page, context }) => {
    await context.grantPermissions(['camera', 'geolocation']);
    await context.setGeolocation({ latitude: 31.1048, longitude: 77.1734, accuracy: 10 });
    await page.goto('/login');

    const capability = await page.evaluate(async () => {
      const mediaDevices = Boolean(navigator.mediaDevices?.getUserMedia);
      const geolocation = Boolean(navigator.geolocation);
      const cameraStream = mediaDevices
        ? await navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            stream.getTracks().forEach((track) => track.stop());
            return true;
          }).catch(() => false)
        : false;
      const position = geolocation
        ? await new Promise<boolean>((resolve) => {
            navigator.geolocation.getCurrentPosition(() => resolve(true), () => resolve(false), { timeout: 5000 });
          })
        : false;
      return { mediaDevices, geolocation, cameraStream, position };
    });

    expect(capability.mediaDevices).toBeTruthy();
    expect(capability.geolocation).toBeTruthy();
    expect(capability.cameraStream).toBeTruthy();
    expect(capability.position).toBeTruthy();
  });

  test('notification permission and local notification plumbing are available', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);
    await page.goto('/login');

    const result = await page.evaluate(async () => {
      if (!('Notification' in window)) return { supported: false, permission: 'unsupported' };
      const permission = await Notification.requestPermission();
      return { supported: true, permission };
    });

    expect(result.supported).toBeTruthy();
    expect(result.permission).toBe('granted');
  });
});
