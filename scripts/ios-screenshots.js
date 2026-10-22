import { chromium, devices } from 'playwright';

(async () => {
  const iPhone = devices['iPhone 14'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone,
    locale: 'en-US',
    // Emulate Chrome on iOS to trigger the Safari warning + step0
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/117.0.5938.88 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  const baseUrl = process.env.MASARIFI_URL || 'https://masarifi-nine.vercel.app';
  await page.goto(baseUrl);

  // ---- Screenshot 1: Login page (landing page before auth) ----
  await page.screenshot({ path: 'login-page.png', fullPage: true });

  // Click the "Download Mobile App" button to open the iOS install modal
  const downloadBtn = await page.getByRole('button', { name: /Download Mobile App/i }).first();
  await downloadBtn.click();
  // Wait for the modal to appear (use a selector that exists in the modal)
  await page.waitForSelector('text=Install on iPhone (Apple iOS)', { timeout: 5000 });
  await page.screenshot({ path: 'download-modal.png', fullPage: true });

  await browser.close();
})();
