/**
 * 用本机 Chrome 截图 + 收集控制台错误（无需下载浏览器）。
 *
 *   node scripts/shot.mjs <url> <out.png> [--w=1440] [--h=900] [--theme=dark] [--full] [--mobile] [--wait=800]
 */
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const url = args[0];
const out = args[1];
if (!url || !out) {
  console.error('usage: node scripts/shot.mjs <url> <out.png> [--w=1440] [--h=900] [--theme=dark] [--full] [--mobile]');
  process.exit(1);
}

const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const has = (name) => args.includes(`--${name}`);

const width = Number(flag('w') ?? 1440);
const height = Number(flag('h') ?? 900);
const theme = flag('theme');
const wait = Number(flag('wait') ?? 900);

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Users/17390/AppData/Local/Google/Chrome/Application/chrome.exe',
];
const { existsSync } = await import('node:fs');
const CHROME = BROWSERS.find((p) => existsSync(p));
if (!CHROME) throw new Error('no local Chromium browser found');

await mkdir(path.dirname(path.resolve(out)), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--font-render-hinting=none'],
  defaultViewport: {
    width,
    height,
    deviceScaleFactor: has('mobile') ? 3 : 2,
    isMobile: has('mobile'),
    hasTouch: has('mobile'),
  },
});

const page = await browser.newPage();
const messages = [];

page.on('console', (msg) => {
  if (['error', 'warning'].includes(msg.type())) {
    messages.push(`[console.${msg.type()}] ${msg.text()}`);
  }
});
page.on('pageerror', (err) => messages.push(`[pageerror] ${err.message}`));
page.on('requestfailed', (req) => {
  const failure = req.failure();
  if (failure && failure.errorText !== 'net::ERR_ABORTED') {
    messages.push(`[requestfailed] ${req.url()} — ${failure.errorText}`);
  }
});

if (theme) {
  await page.evaluateOnNewDocument((value) => {
    try {
      localStorage.setItem('ink:theme', value);
    } catch {}
  }, theme);
}

await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => document.fonts.ready.then(() => true));
await new Promise((resolve) => setTimeout(resolve, wait));

// 触发滚动揭示，避免截图里一片空白
if (has('full')) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((resolve) => setTimeout(resolve, 700));
}

await page.screenshot({ path: path.resolve(out), fullPage: has('full') });

const metrics = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const resources = performance.getEntriesByType('resource');
  const transfer = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  return {
    title: document.title,
    theme: document.documentElement.dataset.theme,
    domNodes: document.querySelectorAll('*').length,
    docHeight: document.body.scrollHeight,
    resources: resources.length,
    transferKB: Math.round(transfer / 1024),
    domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
  };
});

await browser.close();

console.log(JSON.stringify({ out, ...metrics }, null, 0));
if (messages.length) {
  console.log('--- console ---');
  for (const msg of messages.slice(0, 40)) console.log(msg);
}
