const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Navigate to vessel tracking
  await page.goto('http://localhost:3000/vessels', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 5000));

  // Log console messages to stdout for debugging
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  // Check what we see
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('PAGE TEXT (first 500 chars):', bodyText.substring(0, 200));

  // Click DEMO-MMSI-001 (first vessel in candidate list)
  try {
    await page.evaluate(() => {
      const items = document.querySelectorAll('[class*="cursor-pointer"]');
      if (items.length > 0) { items[0].click(); console.log('Clicked vessel 0'); }
      else console.log('No clickable vessels found');
    });
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) { console.log('Click error:', e.message); }

  const dir = '/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104';
  await page.screenshot({ path: dir + '/N7_11_3_vessel_initial.png' });
  console.log('Saved initial screenshot');

  // Move timeline forward ~2 hours
  try {
    await page.evaluate(() => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        const newVal = parseInt(slider.value) + 7200;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(slider, newVal);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Slider moved from', slider.min, 'to', newVal);
      } else {
        console.log('No slider found');
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: dir + '/N7_11_3_vessel_moved.png' });
    console.log('Saved moved screenshot');
  } catch (e) { console.log('Slider error:', e.message); }

  // Test switching to DEMO-MMSI-002
  try {
    await page.evaluate(() => {
      const items = document.querySelectorAll('[class*="cursor-pointer"]');
      if (items.length > 2) { items[2].click(); console.log('Clicked vessel 2'); }
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: dir + '/N7_11_3_vessel_switched.png' });
    console.log('Saved switched screenshot');
  } catch (e) { console.log('Switch error:', e.message); }

  await browser.close();
  console.log('Done');
})();
