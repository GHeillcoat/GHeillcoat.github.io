/**
 * 目录 scrollspy。
 *
 * 标题位置在初始化 / 尺寸变化 / 字体就绪时量一次并缓存，
 * 滚动时只做数值比较，不逐帧触碰布局。
 */

import { qs, qsa } from './lib/dom';
import { onScroll } from './lib/scroll';
import { closeDrawer } from './drawer';

interface Entry {
  heading: HTMLElement;
  item: HTMLLIElement;
}

export function initToc(): void {
  const list = qs('[data-toc-list]');
  const prose = qs('[data-prose]');
  if (!list || !prose) return;

  const links = qsa<HTMLAnchorElement>('a[href^="#"]', list);
  if (!links.length) return;

  const entries: Entry[] = [];
  for (const link of links) {
    const href = link.getAttribute('href') ?? '';
    if (href.length < 2) continue;
    let id = href.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* 保留原样 */
    }
    const heading = document.getElementById(id);
    const item = link.closest('li');
    if (!heading || !item) continue;
    if (!prose.contains(heading)) continue;
    entries.push({ heading, item });
  }
  if (!entries.length) return;

  let tops: number[] = [];
  let active = -1;

  const measure = () => {
    const offset = window.scrollY;
    tops = entries.map((entry) => {
      const rect = entry.heading.getBoundingClientRect();
      return rect.top + offset;
    });
  };

  const update = () => {
    const probe = window.scrollY + 120;
    let next = -1;
    for (let index = 0; index < tops.length; index += 1) {
      const top = tops[index];
      if (typeof top === 'number' && top - 4 <= probe) next = index;
    }
    if (next === active) return;
    active = next;
    entries.forEach((entry, index) => {
      entry.item.classList.toggle('is-active', index === next);
    });
  };

  measure();
  update();

  onScroll(update);

  const remeasure = () => {
    measure();
    update();
  };
  window.addEventListener('resize', remeasure, { passive: true });
  if (document.fonts?.ready) {
    document.fonts.ready.then(remeasure).catch(() => {});
  }

  // 点击目录项后收起移动端抽屉（锚点跳转本身交给浏览器）
  list.addEventListener('click', (event) => {
    if ((event.target as Element | null)?.closest('a')) closeDrawer();
  });
}
