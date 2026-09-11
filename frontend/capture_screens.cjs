const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const routes = [
    { path: '/', name: '1_Dashboard' },
    { path: '/monitoring', name: '2_LiveMonitoring' },
    { path: '/incidents', name: '3_SpillIncidents' },
    { path: '/vessels', name: '4_VesselTracking' },
    { path: '/satellite', name: '5_SatelliteData' },
    { path: '/analytics', name: '6_Analytics' }
  ];

  if (!fs.existsSync('../qa_output')) {
    fs.mkdirSync('../qa_output');
  }

  for (const route of routes) {
    console.log(`Capturing ${route.name}...`);
    await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500)); // wait for maplibre to render tiles and overlays
    await page.screenshot({ path: `../qa_output/${route.name}.png` });
  }

  await browser.close();
  console.log("All screenshots captured.");
})();
