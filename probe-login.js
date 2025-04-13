const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

const USER = process.env.LOGIN_USER;
const PASS = process.env.LOGIN_PASS;

const ATTEMPTS = [
  {
    name: 'By ID',
    actions: async (page) => {
      console.log('🔧 Typing into #signInFormUsername and #signInFormPassword');
      await page.type('#signInFormUsername', USER);
      await page.type('#signInFormPassword', PASS);
      await page.click('#signInFormSubmitButton');
    },
  },
  {
    name: 'By data-testid',
    actions: async (page) => {
      console.log('🔧 Typing into [data-testid] fields');
      await page.type('[data-testid="username-input"]', USER);
      await page.type('[data-testid="password-input"]', PASS);
      await page.click('[data-testid="signin-button"]');
    },
  },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  console.log('🌐 Navigating to riddlenode login page...');
  await page.goto('https://riddlenode.com/multi-asset-multi-test');

  for (const attempt of ATTEMPTS) {
    console.log(`🔍 Trying login method: ${attempt.name}`);
    try {
      await attempt.actions(page);

      console.log('⏳ Waiting for navigation...');
      await page.waitForNavigation({ timeout: 5000 });

      const currentUrl = page.url();
      console.log(`🔗 Current URL after login: ${currentUrl}`);

      if (currentUrl.includes('/multi-asset-multi-test')) {
        console.log(`✅ Login succeeded via "${attempt.name}"`);
        await fs.promises.mkdir('screens', { recursive: true });
        await page.screenshot({ path: `screens/success-${attempt.name}.png` });
        await browser.close();
        process.exit(0);
      } else {
        console.warn(`⚠️ Landed on unexpected page after "${attempt.name}": ${currentUrl}`);
      }
    } catch (e) {
      console.warn(`❌ ${attempt.name} failed: ${e.message}`);
      try {
        await fs.promises.mkdir('screens', { recursive: true });
        await page.screenshot({ path: `screens/fail-${attempt.name}.png` });
      } catch (screenshotErr) {
        console.error('📸 Screenshot failed:', screenshotErr.message);
      }
    }
  }

  console.error('❌ All login attempts failed.');
  await browser.close();
  process.exit(1);
})();