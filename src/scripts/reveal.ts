/**
 * 滚动揭示：进入视口后加 `.is-in`。
 * 同一父级下的兄弟元素会有一点点错落（最多 280ms），只在首次进入时触发。
 */

import { prefersReducedMotion, qsa } from './lib/dom';

export function initReveal(): void {
  const targets = qsa('[data-reveal]');
  if (!targets.length) return;

  const counters = new Map<Element, number>();
  for (const element of targets) {
    const parent = element.parentElement ?? document.body;
    const index = counters.get(parent) ?? 0;
    counters.set(parent, index + 1);
    if (index > 0) element.style.setProperty('--reveal-delay', `${Math.min(index * 70, 280)}ms`);
  }

  const revealNow = () => {
    for (const element of targets) element.classList.add('is-in');
  };

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    revealNow();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    // threshold 必须为 0：归档页一个年份就是两万多像素高，
    // 用 0.05 的话「可见面积占比」永远达不到，整页会一直停在 opacity:0。
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );

  for (const element of targets) observer.observe(element);
}
