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

  // Step 2: Go to the WebGPU test page
  await page.goto('https://riddlenode.com/webgpu', { waitUntil: 'networkidle2' });

  // Step 3: Click the "Run Single Simulation" button
  await page.waitForSelector('button', { visible: true });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const runBtn = btns.find(b => b.textContent.includes('Run Single Simulation'));
    if (runBtn) runBtn.click();
  });

  // Step 4: Wait until logs show computation has started
  try {
    await page.waitForFunction(() => {
      const logLines = Array.from(document.querySelectorAll('div[style*="monospace"] div'));
      return logLines.length > 0;
    }, { timeout: 30000 });
  } catch (err) {
    console.warn("Timed out waiting for logs to appear. Proceeding anyway...");
  }

  // Step 5: Extract and print logs
  const logs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div[style*="monospace"] div'))
      .map(el => el.textContent)
      .slice(-10); // last 10 lines
  });

  const tableData = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    if (!rows || rows.length === 0) return null;

    const extract = (cell) => cell?.textContent?.trim() ?? 'N/A';

    const lastRow = rows[rows.length - 1].querySelectorAll('td');
    return {
      trial: extract(lastRow[0]),
      pi: extract(lastRow[1]),
      points: extract(lastRow[2]),
      error: extract(lastRow[3]),
      time: extract(lastRow[4]),
      throughput: extract(lastRow[5])
    };
  });

  console.log("===== Riddle Logs =====");
  console.log(logs.join('\n'));

  console.log('\n===== Performance Summary =====');
  if (tableData) {
    console.log(`Estimated π: ${tableData.pi}`);
    console.log(`Total Points: ${tableData.points}B`);
    console.log(`Error: ${tableData.error}`);
    console.log(`GPU Time: ${tableData.time}`);
    console.log(`Throughput: ${tableData.throughput}`);
  } else {
    console.log("No performance data found.");
  }

  await browser.close();
})();