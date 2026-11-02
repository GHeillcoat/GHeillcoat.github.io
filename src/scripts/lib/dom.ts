/**
 * 通用 DOM / 浏览器小工具。
 *
 * 所有交互模块共用这些函数；任何一个在旧浏览器里失败都不应该影响正文阅读，
 * 因此这里的每一处都做了兜底（try/catch + 可选链）。
 */

export type Theme = 'light' | 'dark';

export function qs<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T | null {
  return root.querySelector<T>(selector);
}

export function qsa<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** 输入框 / 文本域 / contenteditable：全局快捷键在这些地方要让位给打字 */
export function isEditable(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element.tagName !== 'string') return false;
  const tag = element.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return element.isContentEditable === true;
}

/** 把连续空白压成一个空格（选区文本与 DOM 文本用同一套规矩，方便比对定位） */
export function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/* — 通知 ————————————————————————————————— */

let toastTimer: number | undefined;

/** 屏幕底部的轻盈提示，1.8s 后自行隐去 */
export function toast(text: string): void {
  const element = qs('[data-toast]');
  if (!element) return;
  element.textContent = text;
  element.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => element.classList.remove('is-visible'), 1800);
}

/* — 剪贴板 ——————————————————————————————— */

export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 权限被拒时走下面的兜底 */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/* — 下载 ————————————————————————————————— */

export function safeFilename(name: string): string {
  return (
    name
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim() || 'inkwell'
  );
}

export function download(filename: string, content: string, mime = 'text/markdown;charset=utf-8'): void {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch {
    toast('导出失败');
  }
}

/* — 滚动锁 ———————————————————————————————
 * 浮层可能叠加（面板 → 编辑器），所以用计数管理，
 * 并在隐藏滚动条时补偿等宽的右内边距，避免内容左右跳动。
 */

let lockCount = 0;
let savedOverflow = '';
let savedPaddingRight = '';

export function lockScroll(): void {
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    savedPaddingRight = document.body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
  }
  lockCount += 1;
}

export function unlockScroll(): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPaddingRight;
  }
}
