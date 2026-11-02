/**
 * 移动端抽屉：目录 + 批注（`.post-aside[data-open]`）。
 * 触发者是 dock 上的 `[data-drawer-toggle]` 与文章头部的 `[data-notes-focus]`。
 */

import { lockScroll, prefersReducedMotion, qs, qsa, unlockScroll } from './lib/dom';
import { registerOverlay } from './lib/overlay';

const NARROW_QUERY = '(max-width: 1024px)';

let panel: HTMLElement | null = null;
let backdrop: HTMLElement | null = null;
let locked = false;

function isNarrow(): boolean {
  try {
    return window.matchMedia(NARROW_QUERY).matches;
  } catch {
    return false;
  }
}

function scrollToNotes(): void {
  const notes = qs('[data-notes-panel]');
  if (!notes) return;
  try {
    notes.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  } catch {
    notes.scrollIntoView();
  }
}

export function openDrawer(options: { scrollToNotes?: boolean } = {}): void {
  if (!panel) return;
  if (!isNarrow()) {
    // 宽屏上目录常驻，只需把批注区带到眼前
    if (options.scrollToNotes) scrollToNotes();
    return;
  }
  panel.setAttribute('data-open', '');
  if (backdrop) backdrop.hidden = false;
  if (!locked) {
    lockScroll();
    locked = true;
  }
  if (options.scrollToNotes) scrollToNotes();
}

export function closeDrawer(): void {
  if (!panel) return;
  panel.removeAttribute('data-open');
  if (backdrop) backdrop.hidden = true;
  if (locked) {
    unlockScroll();
    locked = false;
  }
}

export function isDrawerOpen(): boolean {
  return !!panel?.hasAttribute('data-open');
}

export function initDrawer(): void {
  panel = qs('[data-drawer-panel]');
  if (!panel) return;
  backdrop = qs('[data-drawer-backdrop]');

  backdrop?.addEventListener('click', () => closeDrawer());

  for (const button of qsa('[data-drawer-close]')) {
    button.addEventListener('click', () => closeDrawer());
  }

  for (const button of qsa('[data-drawer-toggle]')) {
    button.addEventListener('click', () => {
      if (isDrawerOpen()) closeDrawer();
      else openDrawer();
    });
  }

  for (const button of qsa('[data-notes-focus]')) {
    button.addEventListener('click', () => openDrawer({ scrollToNotes: true }));
  }

  registerOverlay({ name: 'drawer', z: 136, isOpen: isDrawerOpen, close: closeDrawer });

  // 拉宽到桌面布局时自动收起，避免遮罩残留
  try {
    const query = window.matchMedia(NARROW_QUERY);
    query.addEventListener('change', (event) => {
      if (!event.matches) closeDrawer();
    });
  } catch {
    /* 忽略 */
  }
}
