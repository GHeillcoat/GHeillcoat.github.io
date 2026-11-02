/**
 * 命令面板用到的线条图标（与 Icon.astro 同一套路径，客户端按需内联）。
 * 里面的字符串都是常量，不是用户内容，可以放心写进 SVG。
 */

const PATHS: Record<string, string> = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
  folder: '<path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h3.2l2 2.5h8.3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10Z"/>',
  tag: '<path d="M12.6 3.6a2 2 0 0 1 1.4.6l6 6a2 2 0 0 1 0 2.8l-6.9 6.9a2 2 0 0 1-2.8 0l-6-6a2 2 0 0 1-.6-1.4V5.6a2 2 0 0 1 2-2h6.9Z"/><circle cx="8.2" cy="8.2" r="1.2"/>',
  quote:
    '<path d="M9.5 6.5C7 8 6 10 6 12.5c0 .3 0 .5.1.8A3 3 0 1 1 4.5 16"/><path d="M19 6.5C16.5 8 15.5 10 15.5 12.5c0 .3 0 .5.1.8A3 3 0 1 1 14 16"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><path d="M12 7.6h.01"/>',
  moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4"/>',
  rss: '<path d="M5 18.5h.01"/><path d="M4.5 11.5a8 8 0 0 1 8 8"/><path d="M4.5 5.5a14 14 0 0 1 14 14"/>',
  spark: '<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z"/>',
};

export function icon(name: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  // 常量路径，不含任何外部输入
  svg.innerHTML = PATHS[name] ?? PATHS.spark ?? '';
  return svg;
}
