/**
 * 页眉：滚动后的细线状态、移动端菜单、阅读进度、回到顶部。
 * 与滚动有关的读取全部走 onScroll（rAF 节流 + passive），只在帧内写 style / class。
 */

import { prefersReducedMotion, qs } from './lib/dom';
import { registerOverlay } from './lib/overlay';
import { onScroll } from './lib/scroll';

export function initHeader(): void {
  const header = qs('[data-site-header]');
  const progress = qs('[data-progress] span');
  const toTop = qs('[data-to-top]');
  const nav = qs('[data-site-nav]');
  const menuToggle = qs<HTMLButtonElement>('[data-menu-toggle]');

  onScroll((scrollY) => {
    if (header) header.toggleAttribute('data-scrolled', scrollY > 8);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      progress.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }

    if (toTop) toTop.classList.toggle('is-visible', scrollY > 640);
  });

  toTop?.addEventListener('click', () => {
    try {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  });

  if (!nav || !menuToggle) return;

  const isOpen = () => nav.hasAttribute('data-open');
  const setOpen = (open: boolean) => {
    nav.toggleAttribute('data-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  };

  registerOverlay({ name: 'menu', z: 120, isOpen, close: () => setOpen(false) });

  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(!isOpen());
  });

  // 点导航链接后收起菜单
  nav.addEventListener('click', (event) => {
    if ((event.target as Element | null)?.closest('a')) setOpen(false);
  });

  // 点别处收起菜单
  document.addEventListener('click', (event) => {
    if (!isOpen()) return;
    const target = event.target as Element | null;
    if (!target) return;
    if (target.closest('[data-site-nav]') || target.closest('[data-menu-toggle]')) return;
    setOpen(false);
  });
}
