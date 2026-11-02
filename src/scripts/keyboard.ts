/**
 * 全局键盘：Ctrl/Cmd+K 与 `/` 唤出命令面板，Esc 关掉最上层浮层，T 切换明暗。
 * 输入框 / 文本域 / contenteditable 里打字时不劫持任何字母键。
 */

import { isEditable, toast } from './lib/dom';
import { closeTopmostOverlay } from './lib/overlay';
import { openPalette } from './palette';
import { toggleTheme } from './theme';

export function initKeyboard(): void {
  document.addEventListener('keydown', (event) => {
    const key = event.key;
    const modifier = event.ctrlKey || event.metaKey;
    const editing = isEditable(event.target);

    // Ctrl/Cmd + K：任何时候都能唤出面板（包括正在输入时）
    if (modifier && !event.altKey && (key === 'k' || key === 'K')) {
      event.preventDefault();
      openPalette();
      return;
    }

    // Esc：关掉最上面那层浮层
    if (key === 'Escape') {
      if (closeTopmostOverlay()) event.preventDefault();
      return;
    }

    if (editing || modifier || event.altKey) return;

    if (key === '/') {
      event.preventDefault();
      openPalette();
      return;
    }

    if (key === 't' || key === 'T') {
      const theme = toggleTheme();
      toast(theme === 'dark' ? '已换作夜墨' : '已换作宣纸');
    }
  });
}
