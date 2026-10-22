import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 14'],
  // Chrome iOS UA to trigger the Safari warning
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/117.0.5938.88 Mobile/15E148 Safari/604.1',
});

test('iOS install guide shows warning when opened in Chrome on iPhone', async ({ page }) => {
  // Replace with your actual tunnel URL
  const url = process.env.MASARIFI_TUNNEL_URL || 'https://example.com';
  await page.goto(url);
  // Click the Download button (the one that opens the InstallPrompt modal)
  await page.getByRole('button', { name: /Download Mobile App/i }).click();

  // Verify warning is visible
  await expect(page.locator('text=Open the site in Safari')).toBeVisible();

  // Verify step 0 (open in Safari) is visible
  await expect(page.locator('text=Open Safari and go to')).toBeVisible();

  // Verify the three iOS steps are present
  await expect(page.locator('text=Share')).toBeVisible();
  await expect(page.locator('text=Add to Home Screen')).toBeVisible();
  await expect(page.locator('text=Add')).toBeVisible();
});

test.use({
  ...devices['iPhone 14'],
  // Safari iOS UA – should NOT show the warning
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
});

test('iOS install guide without warning when using Safari', async ({ page }) => {
  const url = process.env.MASARIFI_TUNNEL_URL || 'https://example.com';
  await page.goto(url);
  await page.getByRole('button', { name: /Download Mobile App/i }).click();
  // Warning should be hidden
  await expect(page.locator('text=Open the site in Safari')).toBeHidden();
  // Step 0 should be hidden
  await expect(page.locator('text=Open Safari and go to')).toBeHidden();
  // Normal iOS steps should appear
  await expect(page.locator('text=Share')).toBeVisible();
});
