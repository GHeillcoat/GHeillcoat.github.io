/**
 * 主题切换：`<html data-theme>` 由 BaseLayout 的内联脚本在首帧前设好，
 * 这里只负责之后的切换、持久化与广播 `ink:themechange`。
 */

import type { Theme } from './lib/dom';
import { qs } from './lib/dom';

const THEME_KEY = 'ink:theme';
const root = document.documentElement;

export function getTheme(): Theme {
  return root.dataset.theme === 'dark' ? 'dark' : 'light';
}

function persist(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* 隐私模式下忽略 */
  }
}

function savedTheme(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function setTheme(theme: Theme, options: { persist?: boolean } = {}): Theme {
  const next: Theme = theme === 'dark' ? 'dark' : 'light';
  if (root.dataset.theme !== next) root.dataset.theme = next;
  if (options.persist !== false) persist(next);
  document.dispatchEvent(new CustomEvent('ink:themechange', { detail: { theme: next } }));
  return next;
}

export function toggleTheme(): Theme {
  return setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme(): void {
  qs('[data-theme-toggle]')?.addEventListener('click', () => {
    toggleTheme();
  });

  // 用户从未手动选过主题时，跟随系统明暗变化
  try {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener('change', () => {
      const saved = savedTheme();
      if (saved === 'light' || saved === 'dark') return;
      if (new URLSearchParams(window.location.search).get('theme')) return;
      setTheme(query.matches ? 'dark' : 'light', { persist: false });
    });
  } catch {
    /* 老浏览器没有 addEventListener，忽略即可 */
  }
}
