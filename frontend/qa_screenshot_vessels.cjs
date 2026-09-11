const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/vessels', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 5000));

  const dir = '/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104';
  await page.screenshot({ path: dir + '/N7_12_VesselTracking.png' });
  console.log('Saved vessels screenshot');

  await browser.close();
  console.log('Done');
})();
