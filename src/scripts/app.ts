/**
 * 站点的全部前端交互入口。
 * 每个模块都只在相关 DOM 存在时才初始化，因此全站只加载这一个 bundle。
 *
 * TODO(interaction): 由交互工程师替换成完整实现，契约见 docs/dom-contract.md
 */

const root = document.documentElement;

/* 主题 */
function applyTheme(theme: 'light' | 'dark') {
  root.dataset.theme = theme;
  document.dispatchEvent(new CustomEvent('ink:themechange', { detail: { theme } }));
}

document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('ink:theme', next);
  } catch {}
  applyTheme(next as 'light' | 'dark');
});

/* 移动端菜单 */
const nav = document.querySelector<HTMLElement>('[data-site-nav]');
const menuToggle = document.querySelector<HTMLElement>('[data-menu-toggle]');
menuToggle?.addEventListener('click', () => {
  const open = nav?.hasAttribute('data-open');
  if (!nav) return;
  if (open) {
    nav.removeAttribute('data-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  } else {
    nav.setAttribute('data-open', '');
    menuToggle.setAttribute('aria-expanded', 'true');
  }
});

/* 滚动状态 + 阅读进度 */
const header = document.querySelector<HTMLElement>('[data-site-header]');
const progressBar = document.querySelector<HTMLElement>('[data-progress] span');
const toTop = document.querySelector<HTMLElement>('[data-to-top]');

function onScroll() {
  const y = window.scrollY;
  if (header) {
    if (y > 8) header.setAttribute('data-scrolled', '');
    else header.removeAttribute('data-scrolled');
  }
  if (progressBar) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, y / max) : 0;
    progressBar.style.transform = `scaleX(${ratio})`;
  }
  if (toTop) toTop.classList.toggle('is-visible', y > 640);
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

toTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* 滚动揭示 */
const revealTargets = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (revealTargets.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  revealTargets.forEach((el) => io.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('is-in'));
}
