/**
 * 端到端自检：用本机 Chromium（Edge）驱动真实交互，逐项断言。
 *
 *   node scripts/qa.mjs                    # 默认检查 http://127.0.0.1:4321
 *   node scripts/qa.mjs http://localhost:4322   # 生产预览（Pagefind 检索）
 *
 * 退出码 1 表示有失败项。
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Users/17390/AppData/Local/Google/Chrome/Application/chrome.exe',
];
const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) throw new Error('找不到本机 Chromium 浏览器');

const BASE = (process.argv[2] ?? 'http://127.0.0.1:4321').replace(/\/$/, '');

const results = [];
const consoleErrors = [];
let browser;
let page;

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(width = 1440, height = 900) {
  if (page) await page.close();
  page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`${msg.text()}`);
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on('response', (res) => {
    if (res.status() >= 400) consoleErrors.push(`HTTP ${res.status()} ${res.url()}`);
  });
  return page;
}

async function open(path, waitUntil = 'networkidle2') {
  await page.goto(`${BASE}${path}`, { waitUntil, timeout: 45000 });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await sleep(350);
}

async function main() {
  browser = await puppeteer.launch({
    executablePath: exe,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  /* ---------- 首页 ---------- */
  await newPage();
  await open('/');
  const home = await page.evaluate(() => ({
    title: document.title,
    theme: document.documentElement.dataset.theme,
    navCount: document.querySelectorAll('.site-nav .nav-link').length,
    postRows: document.querySelectorAll('.post-row').length,
    featured: document.querySelectorAll('.featured-card').length,
    themeColor: getComputedStyle(document.body).backgroundColor,
    fontLoaded: document.fonts.check('16px "Noto Serif SC"'),
  }));
  check('首页可访问', home.title.includes('墨痕'), home.title);
  check('首页渲染文章列表', home.postRows >= 3, `${home.postRows} 行`);
  check('首页精选卡片', home.featured >= 1, `${home.featured} 张`);
  check('导航项齐全', home.navCount === 5, `${home.navCount} 项`);
  check('中文字体已加载（子集 woff2）', home.fontLoaded);
  check('默认主题生效', ['light', 'dark'].includes(home.theme), home.theme);

  /* ---------- 主题切换 ---------- */
  const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.click('[data-theme-toggle]');
  await sleep(300);
  const themeAfter = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    stored: localStorage.getItem('ink:theme'),
  }));
  check(
    '主题切换并持久化',
    themeAfter.theme !== themeBefore && themeAfter.stored === themeAfter.theme,
    `${themeBefore} -> ${themeAfter.theme}`,
  );
  await page.click('[data-theme-toggle]');
  await sleep(200);

  /* ---------- 命令面板 ---------- */
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await sleep(400);
  const paletteOpen = await page.evaluate(() => !document.querySelector('[data-palette]').hidden);
  check('Ctrl+K 唤起寻章面板', paletteOpen);

  await page.type('[data-palette-input]', '园');
  await sleep(700);
  const paletteState = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[data-palette-item]')];
    return {
      count: items.length,
      engine: document.querySelector('[data-palette-engine]')?.textContent?.trim() ?? '',
      first: items[0]?.textContent?.trim().slice(0, 40) ?? '',
    };
  });
  check('搜索「园」有结果', paletteState.count > 0, `${paletteState.count} 条，引擎 ${paletteState.engine}`);
  check('结果带高亮/标题', paletteState.first.length > 0, paletteState.first);

  const navigated = await page
    .evaluate(() => {
      document.querySelector('[data-palette-item]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    })
    .then(() => page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null))
    .then(() => page.url())
    .then((url) => new URL(url).pathname);
  check('点击结果可跳转', navigated.startsWith('/posts/'), navigated);

  /* ---------- 文章页（选一篇功能齐全的） ---------- */
  const firstPost = await page.evaluate(() => location.pathname);
  const richSlug = 'from-a-sheet-of-xuan-paper';
  const richRes = await page.goto(`${BASE}/posts/${richSlug}/`, { waitUntil: 'domcontentloaded' });
  const richPath = richRes && richRes.status() === 200 ? `/posts/${richSlug}/` : firstPost;
  await open(richPath, 'networkidle2');
  await sleep(900);

  const post = await page.evaluate(() => ({
    tocLinks: document.querySelectorAll('[data-toc-list] a').length,
    mermaidBlocks: document.querySelectorAll('.mermaid-block').length,
    mermaidRendered: document.querySelectorAll('.mermaid-block.is-rendered').length,
    katex: document.querySelectorAll('.katex').length,
    footnotes: document.querySelectorAll('.footnotes').length,
    copyButtons: document.querySelectorAll('.copy-code').length,
    prose: !!document.querySelector('[data-prose]'),
  }));
  check('目录生成', post.tocLinks > 0, `${post.tocLinks} 条`);
  check('公式渲染', post.katex > 0, `${post.katex} 处`);
  check('代码复制按钮注入', post.copyButtons > 0, `${post.copyButtons} 个`);
  if (post.mermaidBlocks > 0) {
    const mermaidRendered = await page.evaluate(async () => {
      document.querySelector('.mermaid-block')?.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 2200));
      return {
        rendered: document.querySelectorAll('.mermaid-block.is-rendered').length,
        svg: document.querySelectorAll('.mermaid-block svg').length,
      };
    });
    check(
      'Mermaid 进入视口后渲染',
      mermaidRendered.rendered > 0 && mermaidRendered.svg > 0,
      `${mermaidRendered.rendered} 块 / ${mermaidRendered.svg} svg`,
    );
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  }

  /* 选中正文 -> 工具条 */
  const selectionShown = await page.evaluate(async () => {
    const p = document.querySelector('[data-prose] p');
    const range = document.createRange();
    range.selectNodeContents(p);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
    p.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 400, clientY: 400 }));
    await new Promise((r) => setTimeout(r, 400));
    return !document.querySelector('[data-selection-toolbar]').hidden;
  });
  check('划词工具条出现', selectionShown);

  if (selectionShown) {
    await page.evaluate(() => document.querySelector('[data-sel-action="note"]').click());
    await sleep(350);
    const editorOpen = await page.evaluate(() => !document.querySelector('[data-note-editor]').hidden);
    check('批注编辑器打开', editorOpen);

    if (editorOpen) {
      await page.type('[data-note-editor-input]', '这是自检写入的一条批注。');
      await page.evaluate(() => document.querySelector('[data-note-editor-save]').click());
      await sleep(600);
      const saved = await page.evaluate(() => {
        const notes = JSON.parse(localStorage.getItem('ink:notes:v1') || '[]');
        return {
          count: notes.length,
          marks: document.querySelectorAll('.prose mark.hl').length,
          panelItems: document.querySelectorAll('[data-notes-list] .note-item').length,
          stored: notes[0]?.note ?? '',
        };
      });
      check('批注写入 localStorage', saved.count >= 1, `${saved.count} 条`);
      check('正文高亮出现', saved.marks >= 1, `${saved.marks} 处`);
      check('批注面板同步', saved.panelItems >= 1, `${saved.panelItems} 项`);

      await page.reload({ waitUntil: 'networkidle2' });
      await sleep(900);
      const persisted = await page.evaluate(() => ({
        marks: document.querySelectorAll('.prose mark.hl').length,
        items: document.querySelectorAll('[data-notes-list] .note-item').length,
      }));
      check('刷新后高亮仍在', persisted.marks >= 1, `${persisted.marks} 处`);
      check('刷新后面板仍在', persisted.items >= 1, `${persisted.items} 项`);

      /* 目录 scrollspy */
      const tocActive = await page.evaluate(async () => {
        const target = document.querySelectorAll('[data-toc-list] a')[1] ?? document.querySelector('[data-toc-list] a');
        target?.click();
        await new Promise((r) => setTimeout(r, 900));
        return document.querySelectorAll('[data-toc-list] li.is-active').length;
      });
      check('目录高亮当前小节', tocActive >= 1, `${tocActive} 个激活项`);
    }
  }

  /* 移动端抽屉 */
  await newPage(390, 844);
  await open(richPath, 'networkidle2');
  await sleep(400);
  const drawer = await page.evaluate(async () => {
    const toggle = document.querySelector('[data-drawer-toggle]');
    if (!toggle) return { available: false };
    toggle.click();
    await new Promise((r) => setTimeout(r, 500));
    const panel = document.querySelector('[data-drawer-panel]');
    return {
      available: true,
      open: panel?.hasAttribute('data-open') ?? false,
      backdrop: !document.querySelector('[data-drawer-backdrop]')?.hidden,
    };
  });
  check('移动端「目录/批注」抽屉', drawer.available && drawer.open, JSON.stringify(drawer));
  check('抽屉遮罩出现', Boolean(drawer.backdrop));

  /* 批注页 */
  await newPage();
  await open('/notes');
  const notesPage = await page.evaluate(() => ({
    groups: document.querySelectorAll('.notes-archive-group').length,
    total: document.querySelector('[data-notes-total]')?.textContent?.trim() ?? '',
    emptyShown: !document.querySelector('[data-notes-archive-empty]')?.hidden,
  }));
  check('批注页按文章分组', notesPage.groups >= 1, `${notesPage.groups} 组 / ${notesPage.total}`);
  check('批注页空状态逻辑', notesPage.emptyShown === false);

  /* 其它页面可访问 */
  for (const path of ['/posts/', '/archive/', '/tags/', '/about/']) {
    const res = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    check(`页面 ${path} 可访问`, res?.status() === 200, String(res?.status()));
  }

  /* 移动端首页无横向溢出 */
  await newPage(390, 844);
  await open('/');
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  check('移动端无横向溢出', overflow.scrollW <= overflow.clientW + 1, `${overflow.scrollW}px vs ${overflow.clientW}px`);

  await browser.close();

  console.log('\n===== 汇总 =====');
  const failed = results.filter((r) => !r.ok);
  console.log(`${results.length - failed.length}/${results.length} 通过`);
  if (failed.length) console.log('失败：' + failed.map((f) => f.name).join('、'));
  const uniqueErrors = [...new Set(consoleErrors)].slice(0, 10);
  if (uniqueErrors.length) {
    console.log(`console 错误 ${uniqueErrors.length} 类：`);
    for (const err of uniqueErrors) console.log('  ' + err);
  } else {
    console.log('console 无错误');
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (err) => {
  console.error('QA 运行失败：', err.message);
  if (browser) await browser.close().catch(() => {});
  process.exit(1);
});
