// Play-test Lantern Heist in real Chromium and capture 4 genuine screenshots.
// Serves game/ locally, plays with the keyboard, waits for live game states,
// and saves JPEGs sized for the make.fun gate (long side <= 1280, short >= 480).
const { chromium } = require('playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const GAME_DIR = path.join(__dirname, 'game');
const OUT_DIR = path.join(__dirname, 'screenshots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(GAME_DIR, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(GAME_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
  const size = fs.statSync(file).size;
  console.log(name, size, 'bytes');
  return size;
}

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await sleep(ms);
  await page.keyboard.up(key);
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Shot 1 (cover): level 1 live play — slip down and hide in the bush while
  // a guard's cone sweeps the corridor.
  await page.goto(`http://127.0.0.1:${port}/index.html?auto=1`, { waitUntil: 'load' });
  await sleep(1000);
  await hold(page, 's', 1000);
  await hold(page, 'd', 500);
  await sleep(1200);
  console.log('shot 1 alert:', await page.textContent('#hud-alert-label'));
  await shot(page, '1-cover.jpg');

  // Shot 2: sneak east along the corridor toward the middle of the map.
  await page.keyboard.down('Shift');
  await hold(page, 'd', 2000);
  await page.keyboard.up('Shift');
  await sleep(400);
  console.log('shot 2 alert:', await page.textContent('#hud-alert-label'));
  await shot(page, '2-sneak.jpg');

  // Shot 3: fresh run — walk into a cone on purpose and snap the moment the
  // guard gets suspicious, before the chase catches the player.
  await page.goto(`http://127.0.0.1:${port}/index.html?auto=1`, { waitUntil: 'load' });
  await sleep(800);
  await hold(page, 'd', 1600);
  await hold(page, 's', 900);
  let alert = 'CALM';
  for (let i = 0; i < 25; i++) {
    alert = await page.textContent('#hud-alert-label');
    if (alert !== 'CALM') break;
    await hold(page, 'a', 300);
    await hold(page, 'd', 300);
  }
  console.log('alert label at shot 3:', alert);
  await shot(page, '3-alert.jpg');

  // Shot 4: level 2 gallery, fresh view with more guards and long sightlines.
  await page.goto(`http://127.0.0.1:${port}/index.html?auto=1&level=2`, { waitUntil: 'load' });
  await sleep(1500);
  await hold(page, 'd', 1200);
  await sleep(500);
  await shot(page, '4-gallery.jpg');

  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
