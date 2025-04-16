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
  {
    name: 'By input[name]',
    actions: async (page) => {
      console.log('🔧 Typing into input[name="username"] and input[name="password"]');
      await page.type('input[name="username"]', USER);
      await page.type('input[name="password"]', PASS);
      await page.keyboard.press('Enter');
    },
  },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
      '--disable-extensions'
    ]
  });

  const page = await browser.newPage();

  // 🐛 Log all requests
  page.on('request', (req) => {
    console.log(`➡️ Request: ${req.method()} ${req.url()}`);
  });

  // 🐛 Log all responses
  page.on('response', (res) => {
    console.log(`⬅️ Response: ${res.status()} ${res.url()}`);
  });

  // 🧾 Console messages from the page
  page.on('console', (msg) => {
    console.log(`🧾 PAGE LOG: ${msg.text()}`);
  });

  // 🚨 JS errors on the page
  page.on('pageerror', (err) => {
    console.error(`🚨 PAGE ERROR: ${err.message}`);
  });

  console.log('🌐 Navigating to riddlenode login page...');
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');

  await page.goto('https://riddlenode.com/', {
    waitUntil: 'networkidle2',
    timeout: 15000
  });

  console.log('⏳ Waiting for Amplify authenticator to appear...');
  try {
    await page.waitForSelector('[data-amplify-authenticator]', { timeout: 10000 });
    console.log('✅ Amplify container detected. Waiting 4s to let inputs render...');
    await page.waitForTimeout(4000);
    
    try {
      console.log('🎯 Attempting to activate the sign-in panel...');
      const tabPanelSelector = '[role="tabpanel"][id*="signIn"]';
      await page.waitForSelector(tabPanelSelector, { timeout: 5000 });
      await page.click(tabPanelSelector);
      await page.waitForTimeout(2000);

      console.log('⏳ Waiting for username input...');
      await page.waitForSelector('[data-amplify-authenticator] input', { timeout: 10000 });
      console.log('✅ Input field detected inside Amplify authenticator.');
    } catch {
      console.warn('⚠️ Could not detect or activate sign-in panel. Inputs might not appear.');
    }
  } catch {
    console.warn('⚠️ Amplify container not detected within 10s.');
  }

  const outerHtml = await page.evaluate(() => {
    const root = document.querySelector('#root');
    return root ? root.outerHTML : '[root not found]';
  });

  console.log('🧱 Root outer HTML snippet:\n', outerHtml.slice(0, 500), '...');
  await fs.promises.writeFile('debug.html', await page.content());
  console.log('📄 Saved debug.html after React app render');

  try {
    const allInputs = await page.$$eval('input', inputs =>
      inputs.map(input => ({
        name: input.name,
        id: input.id,
        type: input.type,
        placeholder: input.placeholder,
        outerHTML: input.outerHTML.slice(0, 100)
      }))
    );
    console.log(`🧪 Found ${allInputs.length} input(s):`, allInputs);
  } catch (e) {
    console.warn('⚠️ Could not extract input fields:', e.message);
  }

  for (const attempt of ATTEMPTS) {
    console.log(`🔍 Trying login method: ${attempt.name}`);
    try {
      await attempt.actions(page);

      console.log('⏳ Waiting for post-login route to appear...');
      let currentUrl = page.url();
      let loginTimeout = Date.now() + 10000;
      while (!currentUrl.includes('/multi-asset-multi-test') && Date.now() < loginTimeout) {
        await new Promise(res => setTimeout(res, 500));
        currentUrl = page.url();
      }
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