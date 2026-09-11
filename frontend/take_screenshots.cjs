const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Dashboard
  await page.setViewport({ width: 1440, height: 900 });
  console.log(`Checking route: Dashboard (/)...`);
  try {
    await page.goto(`http://localhost:3000/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(res => setTimeout(res, 5000));

    const dest1 = '/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104/N7_15_3_Dashboard_1440.png';
    await page.screenshot({ path: dest1 });
    console.log(`Saved Dashboard screenshot to: ${dest1}`);
  } catch (e) {
    console.error(`Failed: ${e.message}`);
  }

  // Vessel Tracking
  console.log(`Checking route: Vessel Tracking (/vessels)...`);
  try {
    await page.goto(`http://localhost:3000/vessels`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(res => setTimeout(res, 5000));
    
    const dest2 = '/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104/N7_15_3_Vessels_1440.png';
    await page.screenshot({ path: dest2 });
    console.log(`Saved Vessel Tracking screenshot to: ${dest2}`);
  } catch (e) {
    console.error(`Failed: ${e.message}`);
  }

  await browser.close();
})();
