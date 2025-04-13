const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://example.com'); // Simple public test page

  await page.waitForSelector('body');
  const html = await page.content();

  console.log('Page loaded. Some content:');
  console.log(html.substring(0, 300)); // Log the first 300 chars

  await browser.close();
})();