// QA for a built MAI explainer page: step through EVERY step in headless Chromium, fail on any page or
// console error, screenshot the last step of each scene, then check back-navigation and a deep link.
//
//   node video-style/tools/explainer_walk.js video-style/explainers/out/<id>.html <out-dir> [width] [height]
//
// Make a contact sheet afterwards with ImageMagick:  montage <out-dir>/*.png -geometry 640x400+4+4 -tile 3x sheet.png
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const [, , file, outDir, w = '1440', hgt = '900'] = process.argv;
if (!file || !outDir) {
  console.error('usage: explainer_walk.js <page.html> <out-dir> [width] [height]');
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +hgt } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`console.${m.type()}: ${m.text()}`); });
  const url = 'file://' + path.resolve(file);
  await page.goto(url);
  await page.waitForTimeout(800);
  const scenes = await page.evaluate(() => MAI.scenes.map((s) => ({ id: s.id, n: s.steps.length })));
  let i = 0;
  for (const sc of scenes) {
    for (let k = 0; k < sc.n; k++) {
      if (i > 0) await page.keyboard.press('ArrowRight');
      i++;
      const last = k === sc.n - 1;
      await page.waitForTimeout(last ? 3600 : 900); // let staggered animations finish before the shot
      if (last) await page.screenshot({ path: path.join(outDir, `${String(i).padStart(3, '0')}-${sc.id}.png`) });
    }
  }
  const end = await page.evaluate(() => location.hash);
  for (let j = 0; j < 5; j++) await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(600);
  const afterBack = await page.evaluate(() => location.hash);
  const deep = `${scenes[Math.floor(scenes.length / 2)].id}--1`;
  await page.goto(`${url}#${deep}`);
  await page.waitForTimeout(1200);
  const landed = await page.evaluate(() => location.hash);
  const report = { steps: i, end, afterBack, deepLink: { asked: `#${deep}`, landed }, errors };
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
  process.exit(errors.length || landed !== `#${deep}` ? 1 : 0);
})();
