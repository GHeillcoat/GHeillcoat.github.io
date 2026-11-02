/**
 * 站点的全部前端交互入口（`BaseLayout` 里 `import '../scripts/app'`）。
 *
 * 每个模块都只在相关 DOM 存在时才初始化，因此全站只加载同一个 bundle；
 * 没有 JavaScript 时页面依然可读，这里加上的都是渐进增强。
 * 契约见 docs/dom-contract.md。
 */

import { initCodeCopy } from './code-copy';
import { initDrawer } from './drawer';
import { initGraph } from './graph';
import { initHeader } from './header';
import { initKeyboard } from './keyboard';
import { initLightbox } from './lightbox';
import { initMermaid } from './mermaid';
import { initNotes } from './notes';
import { initNotesArchive } from './notes-archive';
import { initPalette } from './palette';
import { initReveal } from './reveal';
import { initTheme } from './theme';
import { initToc } from './toc';

function init(): void {
  initTheme();
  initHeader();
  initReveal();
  initPalette();
  initDrawer();
  initToc();
  initLightbox();
  initCodeCopy();
  initMermaid();
  initGraph();
  initNotes();
  initNotesArchive();
  initKeyboard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
