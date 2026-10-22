import { chromium, devices } from 'playwright';

(async () => {
  const iPhone = devices['iPhone 14'];
  const browser = await chromium.launch({ headless: false }); // open visible Chrome window
  const context = await browser.newContext({
    ...iPhone,
    locale: 'en-US',
    // Chrome on iOS UA triggers Safari warning + step0
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/117.0.5938.88 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  const url = process.env.MASARIFI_URL || 'https://masarifi-nine.vercel.app';
  await page.goto(url);

  console.log('✅ Landing page loaded.');
  console.log('👉 Click the "Download Mobile App" button manually to watch the iOS install modal.');
  console.log('   (Or uncomment the lines below to click automatically)');

  // Uncomment to auto‑click the download button and wait for the modal:
  // await page.click('#masarifi-landing-download-btn');
  // await page.waitForSelector('text=Install on iPhone (Apple iOS)', { timeout: 5000 });
  // console.log('✅ Install modal opened – you can see the warning and steps.');

  // Keep the browser open until you close it manually (Ctrl‑C in this terminal stops the script).
})();
