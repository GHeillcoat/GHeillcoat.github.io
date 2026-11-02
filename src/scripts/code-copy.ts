/**
 * 代码块复制按钮。
 * 只为正文里的 `<pre>` 注入（Mermaid 占位块除外），按钮文案与站点气质一致。
 */

import { copyText, qsa, toast } from './lib/dom';

const RESET_DELAY = 1600;

export function initCodeCopy(): void {
  const prose = document.querySelector('[data-prose]');
  if (!prose) return;

  const blocks = qsa<HTMLPreElement>('pre', prose).filter(
    (pre) => !pre.closest('.mermaid-block'),
  );

  for (const pre of blocks) {
    const code = pre.querySelector('code');
    if (!code) continue;
    if (pre.querySelector('.copy-code')) continue;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = '复制';
    button.setAttribute('aria-label', '复制这段代码');

    let resetTimer: number | undefined;
    button.addEventListener('click', async () => {
      const text = code.textContent ?? '';
      const ok = await copyText(text);
      if (!ok) {
        toast('复制失败');
        return;
      }
      button.textContent = '已复制';
      button.classList.add('is-done');
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        button.textContent = '复制';
        button.classList.remove('is-done');
      }, RESET_DELAY);
    });

    pre.appendChild(button);
  }
}
