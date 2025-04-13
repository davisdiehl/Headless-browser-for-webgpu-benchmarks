const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // Step 1: Log in
  await page.goto('https://riddlenode.com/login', { waitUntil: 'networkidle2' });
  await page.type('input[name="username"], input[type="email"]', 'davis-diehl@protonmail.com');
  await page.type('input[name="password"]', 'wesham-sonki2-heMWon');
  await Promise.all([
    page.click('button[type="submit"], button'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  // Step 2: Go to the test page
  await page.goto('https://riddlenode.com/multi-asset-multi-test', { waitUntil: 'networkidle2' });

  // Step 3: Click the "Run Automated Tests" button
  await page.waitForSelector('button', { visible: true });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const autoTestBtn = btns.find(b => b.textContent.includes('Run Automated Tests'));
    if (autoTestBtn) autoTestBtn.click();
  });

  // Step 4: Wait for logs to populate
  await page.waitForTimeout(10000); // Adjust if needed

  // Step 5: Extract and print logs
  const logs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div[style*="monospace"] div'))
      .map(el => el.textContent)
      .slice(-10); // last 10 lines
  });

  console.log("===== Riddle Logs =====");
  console.log(logs.join('\n'));

  await browser.close();
})();