/**
 * 全站只注册一个 scroll / resize 监听：用 requestAnimationFrame 节流，
 * 各模块通过 onScroll 订阅，避免每个模块各自绑一个被动监听。
 */

type ScrollHandler = (scrollY: number) => void;

const subscribers = new Set<ScrollHandler>();
let scheduled = false;
let bound = false;
let lastY = 0;

function flush(): void {
  scheduled = false;
  lastY = window.scrollY || window.pageYOffset || 0;
  for (const handler of subscribers) {
    try {
      handler(lastY);
    } catch {
      /* 单个订阅者出错不应影响其它模块 */
    }
  }
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(flush);
}

/** 订阅滚动（立刻回调一次当前状态），返回取消订阅的函数 */
export function onScroll(handler: ScrollHandler): () => void {
  subscribers.add(handler);
  if (!bound) {
    bound = true;
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.requestAnimationFrame(() => {
      flush();
      try {
        handler(lastY);
      } catch {
        /* 同上 */
      }
    });
  } else {
    window.requestAnimationFrame(() => {
      try {
        handler(lastY);
      } catch {
        /* 同上 */
      }
    });
  }
  return () => {
    subscribers.delete(handler);
  };
}
