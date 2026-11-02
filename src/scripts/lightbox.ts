/**
 * 图片灯箱：点击正文图片放大，←/→ 在同页图片间切换，Esc / 点击背板关闭。
 * 只接管正文里「不在链接内」的图片（链接里的图片通常另有去处）。
 */

import { lockScroll, qs, qsa, unlockScroll } from './lib/dom';
import { registerOverlay } from './lib/overlay';

export function initLightbox(): void {
  const lightbox = qs('[data-lightbox]');
  const image = qs<HTMLImageElement>('[data-lightbox-img]');
  const caption = qs('[data-lightbox-caption]');
  if (!lightbox || !image) return;

  const prose = qs('[data-prose]');
  if (!prose) return;

  const sources = qsa<HTMLImageElement>('img', prose).filter(
    (img) => !img.closest('a') && !img.closest('.mermaid-block'),
  );
  if (!sources.length) return;

  const closeButton = qs<HTMLElement>('[data-lightbox-close]');
  let index = -1;
  let locked = false;

  const captionFor = (source: HTMLImageElement): string => {
    const alt = (source.getAttribute('alt') ?? '').trim();
    if (alt) return alt;
    const figure = source.closest('figure');
    const figcaption = figure?.querySelector('figcaption')?.textContent?.trim() ?? '';
    return figcaption;
  };

  const show = (next: number) => {
    if (!sources.length) return;
    index = ((next % sources.length) + sources.length) % sources.length;
    const source = sources[index];
    if (!source) return;
    image.src = source.currentSrc || source.src;
    image.alt = source.getAttribute('alt') ?? '';
    if (caption) caption.textContent = captionFor(source);
  };

  const isOpen = () => !lightbox.hidden;

  const open = (position: number) => {
    if (isOpen()) {
      show(position);
      return;
    }
    lightbox.hidden = false;
    if (!locked) {
      lockScroll();
      locked = true;
    }
    show(position);
    try {
      closeButton?.focus({ preventScroll: true });
    } catch {
      /* 忽略 */
    }
  };

  const close = () => {
    if (!isOpen()) return;
    lightbox.hidden = true;
    index = -1;
    if (locked) {
      unlockScroll();
      locked = false;
    }
  };

  prose.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const img = target?.closest('img');
    if (!img || img.closest('a') || img.closest('.mermaid-block')) return;
    const position = sources.indexOf(img as HTMLImageElement);
    if (position === -1) return;
    event.preventDefault();
    open(position);
  });

  closeButton?.addEventListener('click', () => close());

  // 点击背板（也就是 lightbox 自身，而不是里面的图）关闭
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + 1);
    }
  });

  registerOverlay({ name: 'lightbox', z: 150, isOpen, close });
}
