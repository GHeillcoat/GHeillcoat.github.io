/**
 * 命令面板（站内搜索）。
 *
 * 数据源两层：
 *   1. 生产环境用 Pagefind（`/pagefind/pagefind.js`，构建后才存在），动态 import、按需加载；
 *   2. 开发环境 / 索引不可用时用页面里的 `data-post-index` 与几个静态快捷项兜底。
 *
 * 结果项全部用 DOM API 拼装：Pagefind 的 excerpt 只提取文本与 `<mark>`，
 * 绝不把 HTML 直接塞进 innerHTML。
 */

import { site } from '../config';
import { icon } from './lib/icons';
import { lockScroll, qs, qsa, unlockScroll } from './lib/dom';
import { registerOverlay } from './lib/overlay';
import { getTheme, toggleTheme } from './theme';

interface PostIndexEntry {
  t: string;
  u: string;
  d?: string;
  c?: string;
  y?: string;
}

interface PaletteItem {
  title: string;
  sub?: string;
  /** Pagefind 的摘要片段，只允许文本与 <mark> */
  subHtml?: string;
  url?: string;
  icon: string;
  run?: () => void;
}

interface PagefindResultData {
  url: string;
  excerpt: string;
  meta?: { title?: string; [key: string]: unknown };
}

interface Pagefind {
  options?: (options: Record<string, unknown>) => Promise<void> | void;
  search: (query: string) => Promise<{
    results: { data: () => Promise<PagefindResultData> }[];
  }>;
}

const NAV_ICONS: Record<string, string> = {
  posts: 'book',
  archive: 'folder',
  tags: 'tag',
  notes: 'quote',
  about: 'info',
};

const NAV_SUBS: Record<string, string> = {
  posts: '全部文章',
  archive: '按时间翻',
  tags: '笺注与分类',
  notes: '书页边上留下的字',
  about: '关于这座书房',
};

let palette: HTMLElement | null = null;
let input: HTMLInputElement | null = null;
let results: HTMLElement | null = null;
let engineLabel: HTMLElement | null = null;

let items: PaletteItem[] = [];
let selected = -1;
let lastTrigger: HTMLElement | null = null;
let searchSeq = 0;
let debounceTimer: number | undefined;

let pagefindState: Pagefind | null | undefined;
let pagefindTask: Promise<Pagefind | null> | null = null;
let postIndex: PostIndexEntry[] | null = null;

/* — 数据 ————————————————————————————————— */

function readPostIndex(): PostIndexEntry[] {
  if (postIndex) return postIndex;
  const script = qs<HTMLScriptElement>('script[data-post-index]');
  if (!script?.textContent) {
    postIndex = [];
    return postIndex;
  }
  try {
    const parsed: unknown = JSON.parse(script.textContent);
    postIndex = Array.isArray(parsed)
      ? parsed.filter((entry): entry is PostIndexEntry => {
          if (!entry || typeof entry !== 'object') return false;
          const raw = entry as Record<string, unknown>;
          return typeof raw.t === 'string' && typeof raw.u === 'string';
        })
      : [];
  } catch {
    postIndex = [];
  }
  return postIndex;
}

function loadPagefind(): Promise<Pagefind | null> {
  if (pagefindTask) return pagefindTask;
  pagefindTask = (async () => {
    // 开发环境（`astro dev`）没有 Pagefind 索引，直接走 data-post-index 兜底，
    // 免得去 404 一个 /pagefind/pagefind.js 在控制台里留红字。
    if (!import.meta.env.PROD) return null;
    try {
      const href = new URL('/pagefind/pagefind.js', window.location.origin).href;
      const module = (await import(/* @vite-ignore */ href)) as {
        default?: Pagefind;
      } & Pagefind;
      const pagefind = (module.default ?? (module as unknown as Pagefind)) || null;
      if (!pagefind || typeof pagefind.search !== 'function') return null;
      if (typeof pagefind.options === 'function') {
        try {
          await pagefind.options({ excerptLength: 28 });
        } catch {
          /* 版本差异，忽略 */
        }
      }
      return pagefind;
    } catch {
      return null;
    }
  })().then((found) => {
    pagefindState = found;
    return found;
  });
  return pagefindTask;
}

function quickItems(): PaletteItem[] {
  const navItems: PaletteItem[] = site.nav.map((entry) => ({
    title: entry.label,
    sub: NAV_SUBS[entry.key] ?? '',
    url: entry.href,
    icon: NAV_ICONS[entry.key] ?? 'book',
  }));

  return [
    { title: '首页', sub: site.tagline, url: '/', icon: 'book' },
    ...navItems,
    {
      title: getTheme() === 'dark' ? '换作宣纸' : '换作夜墨',
      sub: '明暗切换',
      icon: getTheme() === 'dark' ? 'sun' : 'moon',
      run: () => {
        toggleTheme();
      },
    },
    { title: 'RSS 订阅', sub: '把书房装进阅读器', url: '/rss.xml', icon: 'rss' },
  ];
}

function fallbackSearch(query: string): PaletteItem[] {
  const needle = query.toLowerCase();
  const scored = readPostIndex()
    .map((post, index) => {
      const title = (post.t ?? '').toLowerCase();
      const category = (post.c ?? '').toLowerCase();
      const description = (post.d ?? '').toLowerCase();
      const year = String(post.y ?? '');
      let score = 0;
      if (title === needle) score += 12;
      else if (title.includes(needle)) score += 8;
      if (category.includes(needle)) score += 4;
      if (description.includes(needle)) score += 3;
      if (year.includes(needle)) score += 2;
      return { post, score, index };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 8);

  return scored.map(({ post }) => ({
    title: post.t,
    sub: [post.c, post.y].filter(Boolean).join(' · '),
    url: post.u,
    icon: 'book',
  }));
}

async function pagefindSearch(pagefind: Pagefind, query: string): Promise<PaletteItem[]> {
  const response = await pagefind.search(query);
  const top = response.results.slice(0, 8);
  const data = await Promise.all(
    top.map((result) =>
      Promise.resolve(result.data()).catch(() => null),
    ),
  );
  return data
    .filter((entry): entry is PagefindResultData => !!entry && typeof entry.url === 'string')
    .map((entry) => ({
      title: (entry.meta?.title ?? '').trim() || entry.url,
      subHtml: entry.excerpt ?? '',
      url: entry.url,
      icon: 'book',
    }));
}

/* — 渲染 ————————————————————————————————— */

/** 只保留文本与 <mark>，其余标签一律丢掉 */
function appendExcerpt(parent: HTMLElement, html: string): void {
  let source: Element | null = null;
  try {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    source = doc.body.firstElementChild;
  } catch {
    source = null;
  }
  if (!source) return;

  const walk = (node: Node, target: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(child.nodeValue ?? ''));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        if (element.tagName === 'MARK') {
          const mark = document.createElement('mark');
          walk(element, mark);
          target.appendChild(mark);
        } else {
          walk(element, target);
        }
      }
    }
  };

  walk(source, parent);
  const text = parent.textContent ?? '';
  if (!text.trim()) parent.textContent = '';
}

/** 在文本里标出命中的关键词（用 textContent 拆分，不拼 HTML） */
function appendHighlighted(parent: HTMLElement, text: string, query: string): void {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    parent.textContent = text;
    return;
  }
  const haystack = text.toLowerCase();
  let cursor = 0;
  while (cursor < text.length) {
    const found = haystack.indexOf(needle, cursor);
    if (found === -1) break;
    if (found > cursor) parent.appendChild(document.createTextNode(text.slice(cursor, found)));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(found, found + needle.length);
    parent.appendChild(mark);
    cursor = found + needle.length;
  }
  if (cursor < text.length) parent.appendChild(document.createTextNode(text.slice(cursor)));
}

function createItemElement(item: PaletteItem, index: number, query: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'palette-item';
  button.id = `palette-option-${index}`;
  button.dataset.paletteItem = '';
  button.dataset.index = String(index);
  button.setAttribute('role', 'option');
  button.setAttribute('aria-selected', 'false');

  const iconWrap = document.createElement('span');
  iconWrap.className = 'pi-icon';
  iconWrap.appendChild(icon(item.icon));

  const main = document.createElement('span');
  main.className = 'pi-main';

  const title = document.createElement('span');
  title.className = 'pi-title';
  appendHighlighted(title, item.title, query);
  main.appendChild(title);

  if (item.subHtml) {
    const sub = document.createElement('span');
    sub.className = 'pi-sub';
    appendExcerpt(sub, item.subHtml);
    if (sub.textContent?.trim()) main.appendChild(sub);
  } else if (item.sub) {
    const sub = document.createElement('span');
    sub.className = 'pi-sub';
    sub.textContent = item.sub;
    main.appendChild(sub);
  }

  const hint = document.createElement('span');
  hint.className = 'pi-hint';
  hint.textContent = '↵';

  button.append(iconWrap, main, hint);
  return button;
}

function render(nextItems: PaletteItem[], options: { group: string | null; engine: string; query: string }): void {
  if (!results) return;
  items = nextItems;
  results.textContent = '';

  if (options.group) {
    const group = document.createElement('p');
    group.className = 'palette-group';
    group.setAttribute('data-palette-group', '');
    group.textContent = options.group;
    results.appendChild(group);
  }

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'palette-empty';
    empty.textContent = options.query ? `没有找到「${options.query}」` : '没有结果';
    results.appendChild(empty);
    selected = -1;
  } else {
    items.forEach((item, index) => {
      results?.appendChild(createItemElement(item, index, options.query));
    });
    selected = 0;
  }

  if (engineLabel) engineLabel.textContent = options.engine;
  applySelection();
}

function applySelection(scrollIntoView = false): void {
  if (!results) return;
  const elements = qsa<HTMLElement>('[data-palette-item]', results);
  for (const element of elements) {
    const isSelected = Number(element.dataset.index) === selected;
    element.setAttribute('aria-selected', String(isSelected));
    if (isSelected && scrollIntoView) element.scrollIntoView({ block: 'nearest' });
  }
  const active = selected >= 0 ? elements[selected] : null;
  if (input) {
    if (active) input.setAttribute('aria-activedescendant', active.id);
    else input.removeAttribute('aria-activedescendant');
  }
}

/* — 搜索流程 ——————————————————————————— */

async function runSearch(rawQuery: string): Promise<void> {
  const query = rawQuery.trim();
  const seq = ++searchSeq;

  if (!query) {
    render(quickItems(), { group: '常用', engine: '站内页面', query: '' });
    return;
  }

  if (pagefindState) {
    try {
      const found = await pagefindSearch(pagefindState, query);
      if (seq !== searchSeq) return;
      render(found, { group: '命中', engine: 'Pagefind', query });
      return;
    } catch {
      /* 索引坏了就当没有 */
    }
    if (seq !== searchSeq) return;
    render(fallbackSearch(query), { group: '命中', engine: '站内页面', query });
    return;
  }

  // Pagefind 未知或不可用：先给兜底结果，能升级再升级
  render(fallbackSearch(query), { group: '命中', engine: '站内页面', query });
  if (pagefindState !== undefined) return;

  const pagefind = await loadPagefind();
  if (!pagefind || seq !== searchSeq) return;
  try {
    const found = await pagefindSearch(pagefind, query);
    if (seq !== searchSeq) return;
    render(found, { group: '命中', engine: 'Pagefind', query });
  } catch {
    /* 保留兜底结果 */
  }
}

function scheduleSearch(query: string): void {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    void runSearch(query);
  }, 130);
}

/* — 开关 ————————————————————————————————— */

function isOpen(): boolean {
  return !!palette && !palette.hidden;
}

function open(trigger?: HTMLElement | null): void {
  if (!palette || !input) return;
  if (isOpen()) {
    input.focus({ preventScroll: true });
    return;
  }
  const active = document.activeElement;
  lastTrigger =
    trigger ?? (active instanceof HTMLElement && active !== document.body ? active : null);
  palette.hidden = false;
  document.body.setAttribute('data-palette-open', '');
  lockScroll();
  input.value = '';
  render(quickItems(), { group: '常用', engine: '站内页面', query: '' });
  input.focus({ preventScroll: true });
  input.select();

  // 第一次打开面板时才去探/加载 Pagefind
  if (pagefindState === undefined) void loadPagefind();
}

function close(): void {
  if (!isOpen() || !palette) return;
  palette.hidden = true;
  document.body.removeAttribute('data-palette-open');
  unlockScroll();
  searchSeq += 1;
  const trigger = lastTrigger;
  lastTrigger = null;
  if (trigger && document.contains(trigger)) {
    try {
      trigger.focus({ preventScroll: true });
    } catch {
      /* 忽略 */
    }
  }
}

function activate(index: number): void {
  const item = items[index];
  if (!item) return;
  if (item.run) {
    item.run();
    close();
    return;
  }
  if (item.url) window.location.assign(item.url);
}

export function openPalette(trigger?: HTMLElement | null): void {
  open(trigger);
}

export function isPaletteOpen(): boolean {
  return isOpen();
}

export function initPalette(): void {
  palette = qs('[data-palette]');
  if (!palette) return;
  input = qs<HTMLInputElement>('[data-palette-input]');
  results = qs('[data-palette-results]');
  engineLabel = qs('[data-palette-engine]');

  for (const trigger of qsa('[data-palette-open]')) {
    trigger.addEventListener('click', () => open(trigger));
  }

  qs('[data-palette-close]')?.addEventListener('click', () => close());

  input?.addEventListener('input', () => {
    scheduleSearch(input?.value ?? '');
  });

  input?.addEventListener('keydown', (event) => {
    if (event.isComposing) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!items.length) return;
      selected = (selected + 1) % items.length;
      applySelection(true);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!items.length) return;
      selected = selected <= 0 ? items.length - 1 : selected - 1;
      applySelection(true);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (selected >= 0) activate(selected);
    }
  });

  // 鼠标移动同步选中；mousedown 阻止默认以保住输入框焦点
  results?.addEventListener('mousedown', (event) => event.preventDefault());
  results?.addEventListener('mouseover', (event) => {
    const element = (event.target as Element | null)?.closest<HTMLElement>('[data-palette-item]');
    if (!element) return;
    const index = Number(element.dataset.index);
    if (!Number.isFinite(index) || index === selected) return;
    selected = index;
    applySelection();
  });
  results?.addEventListener('click', (event) => {
    const element = (event.target as Element | null)?.closest<HTMLElement>('[data-palette-item]');
    if (!element) return;
    activate(Number(element.dataset.index));
  });

  registerOverlay({ name: 'palette', z: 140, isOpen, close });

  // 生产环境在首屏空闲时就把 Pagefind 预取好：
  // 冷启动时第一次搜索才不会先闪一下「站内页面」兜底结果。
  if (import.meta.env.PROD) {
    const preload = () => void loadPagefind();
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(preload, { timeout: 2500 });
    } else {
      window.setTimeout(preload, 1200);
    }
  }


  // 视口变化时把选中项拉回可视区
  window.addEventListener(
    'resize',
    () => {
      if (isOpen()) applySelection(true);
    },
    { passive: true },
  );
}
