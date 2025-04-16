const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // Step 1: Log in
  await page.goto('https://riddlenode.com/', { waitUntil: 'networkidle2' });
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36');
  await page.waitForSelector('[data-amplify-authenticator]', { timeout: 10000 });
  await new Promise(res => setTimeout(res, 4000));
  await page.type('input[name="username"]', 'davis-diehl@protonmail.com');
  await page.type('input[name="password"]', 'wesham-sonki2-heMWon');
  await page.keyboard.press('Enter');
  await new Promise(res => setTimeout(res, 8000));

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
  await new Promise(res => setTimeout(res, 10000)); // Adjust if needed

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