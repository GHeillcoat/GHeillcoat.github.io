/**
 * 知识图谱引擎（Canvas 2D，零依赖）。
 *
 * 数据来自 `<div class="graph-panel" data-graph>` 内部的
 * `<script type="application/json" data-graph-data>`：
 *   { nodes: [{ id, title, category, url, degree }], edges: [{ source, target }] }
 *
 * 分工：
 *   - `lib/graph-model.ts` 解析 JSON、整理索引与邻居表；
 *   - `lib/graph-layout.ts` 力导向布局（斥力 + 弹簧 + 重力 + 阻尼）；
 *   - `lib/graph-paint.ts`  取 CSS 变量上色、批量路径绘制；
 *   - 本文件负责尺寸/DPR、视口变换、指针与滚轮交互、提示层、主题与生命周期。
 *
 * 契约见 docs/graph-contract.md。这里的一切都是增强：出错就静默降级，
 * 不做 loading 态，也不要影响正文阅读。
 */

import { clamp, prefersReducedMotion, qs, qsa } from './lib/dom';
import { onScroll } from './lib/scroll';
import { buildModel, parseGraphPayload } from './lib/graph-model';
import { createLayout } from './lib/graph-layout';
import { createPainter, screenRadius, type PaintScene, type Rect, type View } from './lib/graph-paint';

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 1.3;
/** 适配视图时四边留白（CSS px），跟着容器大小收一点 */
const FIT_PADDING = 44;
/** 拖动小于这个距离就算「点按」，可以跳转 */
const CLICK_SLOP = 5;
/** 首帧预热步数：先让节点散开，第一眼不会是挤在原点的一团，
 *  也让「初始视图」的取景接近最终形态（点「重置」回到的就是它） */
const WARMUP_STEPS = 96;
/** 预热之后剩下的一点余温：约 1 秒的轻微归位，不是整段 2.5s 的乱飞 */
const WARMUP_ALPHA = 0.5;
/** reduced-motion：直接跑到静止，最多这么多步 */
const REDUCED_STEPS = 600;
const DEFAULT_HEIGHT = 520;

interface Point {
  x: number;
  y: number;
}

function ensurePositioned(element: HTMLElement): void {
  // 提示层是绝对定位的；模板没有样式时这里兜一下，免得提示跑到页面角落
  try {
    if (getComputedStyle(element).position === 'static') element.style.position = 'relative';
  } catch {
    /* 忽略 */
  }
}

export function initGraph(): void {
  for (const panel of qsa<HTMLElement>('[data-graph]')) {
    try {
      setupPanel(panel);
    } catch {
      /* 单独一块面板出错不该拖累别处 */
    }
  }
}

function setupPanel(panel: HTMLElement): void {
  const canvas = qs<HTMLCanvasElement>('[data-graph-canvas]', panel);
  const dataElement = qs<HTMLElement>('[data-graph-data]', panel);
  if (!canvas || !dataElement) return;

  const payload = parseGraphPayload(dataElement);
  if (!payload) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const tip = qs<HTMLElement>('[data-graph-tip]', panel);
  const panelHeight = clamp(Number(panel.dataset.graphHeight) || DEFAULT_HEIGHT, 120, 1600);
  const mode = panel.dataset.graphMode === 'local' ? 'local' : 'global';
  const model = buildModel(payload, { mode, focus: panel.dataset.graphFocus ?? '' });

  const layout = createLayout(model);
  const painter = createPainter();
  painter.refresh(panel);
  const reduced = prefersReducedMotion();

  canvas.style.display = 'block';
  canvas.style.width = '100%';
  // 窄屏高度交给 CSS（设计按断点给了自己的高度），宽屏才用 data-graph-height
  applyHeight();
  // 单指拖动画布时不要顺手滚页面；缩放/平移自己算
  canvas.style.touchAction = 'none';
  ensurePositioned(panel);
  if (tip) {
    tip.style.pointerEvents = 'none';
  }

  let view: View = { scale: 1, tx: 0, ty: 0 };
  /** 缩放下限：一般情况下就是契约里的 0.4，大图时随适配缩放一起放低 */
  let minScale = ZOOM_MIN;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let dpr = 1;
  let started = false;
  let visible = false;
  let hover = -1;
  let dragIndex = -1;
  let panning = false;
  let moved = false;
  let raf = 0;
  let paintQueued = false;
  /** 用户动过视图之后，窗口变化不再自动重新取景 */
  let interacted = false;
  let rect: DOMRect | null = null;

  const pointers = new Map<number, Point>();
  let downPoint: Point | null = null;
  let panAnchor: Point | null = null;
  let pinch: { distance: number; center: Point; scale: number } | null = null;

  let tipIndex = -1;
  let tipWidth = 0;
  let tipHeight = 0;
  /** 标签回避区（画布坐标）：控制按钮、提示文字 */
  let reserved: Rect[] = [];

  /** 高度策略：宽屏按 data-graph-height 写内联；窄屏把控制权交回 CSS 断点 */
  function applyHeight(): void {
    const value = window.innerWidth <= 1024 ? '' : `${panelHeight}px`;
    if (canvas.style.height !== value) canvas.style.height = value;
  }

  function reservedRegions(): Rect[] {
    const regions: Rect[] = [];
    const base = canvas.getBoundingClientRect();
    if (base.width < 2 || base.height < 2) return regions;
    const add = (left: number, top: number, right: number, bottom: number) => {
      const width = right - left;
      const height = bottom - top;
      if (width > 0 && height > 0) regions.push({ x: left - base.left, y: top - base.top, width, height });
    };

    // 控制按钮在宽屏是右下、窄屏被 CSS 挪到右上，所以直接量它们的包围盒
    const buttons = qsa<HTMLElement>('[data-graph-zoom-in], [data-graph-zoom-out], [data-graph-reset]', panel);
    if (buttons.length) {
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      for (const button of buttons) {
        const box = button.getBoundingClientRect();
        left = Math.min(left, box.left);
        top = Math.min(top, box.top);
        right = Math.max(right, box.right);
        bottom = Math.max(bottom, box.bottom);
      }
      add(left, top, right, bottom + 8);
    }

    const hint = qs<HTMLElement>('.graph-hint', panel);
    if (hint) {
      const box = hint.getBoundingClientRect();
      add(box.left, box.top, box.right, box.bottom);
    }
    return regions;
  }

  /* — 尺寸 / 视口 ————————————————————————— */

  function measure(): boolean {
    // 用 CSS 像素量，位图按 DPR 放大；canvas.width 一变，context 状态就重置了
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (cssWidth < 2 || cssHeight < 2) return false;
    const nextDpr = Math.min(3, window.devicePixelRatio || 1);
    const bitmapWidth = Math.round(cssWidth * nextDpr);
    const bitmapHeight = Math.round(cssHeight * nextDpr);
    if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
      canvas.width = bitmapWidth;
      canvas.height = bitmapHeight;
    }
    canvasWidth = cssWidth;
    canvasHeight = cssHeight;
    dpr = nextDpr;
    reserved = reservedRegions();
    return true;
  }

  function worldBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of model.nodes) {
      const pad = node.r + 6;
      minX = Math.min(minX, node.x - pad);
      minY = Math.min(minY, node.y - pad);
      maxX = Math.max(maxX, node.x + pad);
      maxY = Math.max(maxY, node.y + pad);
    }
    if (model.focus >= 0) {
      // 局部图谱以中心节点为轴取对称包围盒，中心才落在视觉正中
      const focus = model.nodes[model.focus]!;
      const spanX = Math.max(focus.x - minX, maxX - focus.x, 48);
      const spanY = Math.max(focus.y - minY, maxY - focus.y, 48);
      return {
        minX: focus.x - spanX,
        maxX: focus.x + spanX,
        minY: focus.y - spanY,
        maxY: focus.y + spanY,
      };
    }
    return { minX, minY, maxX, maxY };
  }

  function fitView(): View {
    const bounds = worldBounds();
    const spanX = Math.max(1, bounds.maxX - bounds.minX);
    const spanY = Math.max(1, bounds.maxY - bounds.minY);
    const padding = Math.min(FIT_PADDING, canvasWidth * 0.14, canvasHeight * 0.14);
    const availableX = Math.max(40, canvasWidth - padding * 2);
    const availableY = Math.max(40, canvasHeight - padding * 2);
    const fitted = Math.min(availableX / spanX, availableY / spanY);
    // 图特别大时适配缩放会低于 0.4；这时把下限跟着放低一点，
    // 否则「初次进页面看不全、缩小又没有反应」。
    minScale = Math.min(ZOOM_MIN, fitted * 0.85);
    const scale = clamp(fitted, minScale, ZOOM_MAX);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    return { scale, tx: canvasWidth / 2 - centerX * scale, ty: canvasHeight / 2 - centerY * scale };
  }

  function scaleAt(point: Point, nextScale: number): void {
    const scale = clamp(nextScale, minScale, ZOOM_MAX);
    if (!Number.isFinite(scale) || Math.abs(scale - view.scale) < 1e-4) return;
    const ratio = scale / view.scale;
    view.tx = point.x - (point.x - view.tx) * ratio;
    view.ty = point.y - (point.y - view.ty) * ratio;
    view.scale = scale;
    interacted = true;
  }

  /* — 绘制 ————————————————————————————— */

  function paint(): void {
    if (!started) return;
    const scene: PaintScene = {
      width: canvasWidth,
      height: canvasHeight,
      dpr,
      view,
      model,
      hover,
      drag: dragIndex,
      reserved,
    };
    painter.paint(ctx, scene);
  }

  function requestPaint(): void {
    if (paintQueued) return;
    paintQueued = true;
    window.requestAnimationFrame(() => {
      paintQueued = false;
      paint();
    });
  }

  function startLoop(): void {
    if (reduced || raf) return;
    raf = window.requestAnimationFrame(frame);
  }

  function stopLoop(): void {
    if (!raf) return;
    window.cancelAnimationFrame(raf);
    raf = 0;
  }

  function frame(): void {
    raf = 0;
    const more = layout.tick();
    // 停下来的那一刻补一次取景：动画期间节点还会挪一点，
    // 这样「重置」才有准头，也避免最后一帧有节点被挤出画布。
    if (!more && !interacted) view = fitView();
    paint();
    if (more) startLoop();
  }

  function wake(alpha: number): void {
    if (reduced) {
      paint();
      return;
    }
    layout.heat(alpha);
    startLoop();
  }

  function start(): void {
    if (started) return;
    if (!measure()) return;
    started = true;

    if (reduced) {
      // 不做逐帧动画：先跑到终态，再画一帧
      layout.finish(REDUCED_STEPS);
      view = fitView();
      paint();
      return;
    }

    layout.settle(WARMUP_STEPS);
    view = fitView();
    paint();
    if (visible) wake(WARMUP_ALPHA);
  }

  /* — 提示层 ————————————————————————————— */

  function placeTip(point: Point): void {
    if (!tip) return;
    const gap = 14;
    let left = point.x + gap;
    let top = point.y + gap;
    if (left + tipWidth > canvasWidth - 6) left = point.x - gap - tipWidth;
    if (top + tipHeight > canvasHeight - 6) top = point.y - gap - tipHeight;
    left = clamp(left, 6, Math.max(6, canvasWidth - tipWidth - 6));
    top = clamp(top, 6, Math.max(6, canvasHeight - tipHeight - 6));
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function showTip(index: number, point: Point): void {
    if (!tip) return;
    const node = model.nodes[index];
    if (!node) return;
    if (tipIndex !== index) {
      const meta = [node.category, `${node.degree} 条链接`].filter(Boolean).join(' · ');
      // 两行：标题一行，分类/链接数一行。<br> 才能在 nowrap 的样式里换行
      tip.replaceChildren(
        document.createTextNode(node.title),
        document.createElement('br'),
        document.createTextNode(meta),
      );
      tipIndex = index;
      if (tip.style.display === 'none') tip.style.display = '';
      tip.hidden = false;
      tipWidth = tip.offsetWidth;
      tipHeight = tip.offsetHeight;
      if (tipWidth === 0) {
        // 兜底：设计样式若把 [hidden] 的 display 覆盖掉，就手动打开再量一次
        tip.style.display = 'block';
        tipWidth = tip.offsetWidth;
        tipHeight = tip.offsetHeight;
      }
    }
    placeTip(point);
  }

  function hideTip(): void {
    if (!tip || tipIndex < 0) return;
    tipIndex = -1;
    tip.hidden = true;
    // 同上：样式覆盖了 [hidden] 时，用内联 display 真正藏起来
    if (tip.offsetWidth > 0) tip.style.display = 'none';
  }

  /* — 命中 / 光标 ——————————————————————— */

  function pointOf(event: PointerEvent | WheelEvent): Point {
    const box = rect ?? canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function nodeAt(point: Point): number {
    const scale = view.scale;
    let best = -1;
    let bestDistance = Infinity;
    for (const node of model.nodes) {
      const x = node.x * scale + view.tx;
      const y = node.y * scale + view.ty;
      const radius = Math.max(screenRadius(node, scale) + 5, 9);
      const dx = point.x - x;
      const dy = point.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius && distance < bestDistance) {
        bestDistance = distance;
        best = node.index;
      }
    }
    return best;
  }

  function setCursor(value: string): void {
    if (canvas.style.cursor !== value) canvas.style.cursor = value;
  }

  function refreshCursor(): void {
    if (dragIndex >= 0 || panning) {
      setCursor('grabbing');
      return;
    }
    setCursor(hover >= 0 ? 'pointer' : 'grab');
  }

  /* — 多点触控辅助 ——————————————————————— */

  function pointerPair(): [Point, Point] | null {
    const values = Array.from(pointers.values());
    if (values.length < 2) return null;
    return [values[0]!, values[1]!];
  }

  function pinchDistance(): number {
    const pair = pointerPair();
    if (!pair) return 0;
    return Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
  }

  function pinchCenter(): Point {
    const pair = pointerPair();
    if (!pair) return { x: canvasWidth / 2, y: canvasHeight / 2 };
    return { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 };
  }

  /* — 指针交互 ——————————————————————————— */

  function onPointerDown(event: PointerEvent): void {
    if (!started) return;
    // 第三根手指忽略
    if (event.pointerType === 'touch' && pointers.size >= 2) return;
    event.preventDefault();
    rect = canvas.getBoundingClientRect();
    const point = pointOf(event);
    // 注意：这里必须存副本。指针表里的坐标每次移动都会被原地更新，
    // 如果 downPoint / panAnchor 直接引用同一个对象，位移就永远是 0。
    pointers.set(event.pointerId, { x: point.x, y: point.y });
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* 忽略 */
    }
    // 手势期间先停下模拟，交互才跟手
    stopLoop();

    if (pointers.size === 1) {
      downPoint = { x: point.x, y: point.y };
      panAnchor = { x: point.x, y: point.y };
      moved = false;
      const hit = nodeAt(point);
      hover = hit;
      if (hit >= 0) {
        dragIndex = hit;
        const node = model.nodes[hit]!;
        node.vx = 0;
        node.vy = 0;
        hideTip();
      } else {
        panning = true;
      }
      refreshCursor();
      if (hit >= 0) paint();
      return;
    }

    dragIndex = -1;
    panning = false;
    downPoint = null;
    panAnchor = null;
    hover = -1;
    hideTip();
    const distance = pinchDistance();
    if (distance > 0) pinch = { distance, center: pinchCenter(), scale: view.scale };
    refreshCursor();
  }

  function onPointerMove(event: PointerEvent): void {
    const tracked = pointers.get(event.pointerId);
    const point = pointOf(event);
    if (tracked) {
      tracked.x = point.x;
      tracked.y = point.y;
    }

    if (pointers.size >= 2) {
      if (!pinch) return;
      const distance = pinchDistance();
      const center = pinchCenter();
      if (distance > 0 && pinch.distance > 0) {
        // 先跟中点平移，再以中点为中心缩放
        view.tx += center.x - pinch.center.x;
        view.ty += center.y - pinch.center.y;
        pinch.center = center;
        scaleAt(center, (pinch.scale * distance) / pinch.distance);
        interacted = true;
      }
      hideTip();
      requestPaint();
      return;
    }

    if (dragIndex >= 0) {
      const node = model.nodes[dragIndex]!;
      node.x = (point.x - view.tx) / view.scale;
      node.y = (point.y - view.ty) / view.scale;
      node.vx = 0;
      node.vy = 0;
      if (downPoint && Math.hypot(point.x - downPoint.x, point.y - downPoint.y) > CLICK_SLOP) moved = true;
      hideTip();
      requestPaint();
      return;
    }

    if (panning) {
      if (panAnchor) {
        view.tx += point.x - panAnchor.x;
        view.ty += point.y - panAnchor.y;
      }
      panAnchor = { x: point.x, y: point.y };
      if (downPoint && Math.hypot(point.x - downPoint.x, point.y - downPoint.y) > CLICK_SLOP) moved = true;
      interacted = true;
      requestPaint();
      return;
    }

    if (event.pointerType === 'touch') return;

    const hit = nodeAt(point);
    if (hit !== hover) {
      hover = hit;
      refreshCursor();
      requestPaint();
    }
    if (hit >= 0) showTip(hit, point);
    else hideTip();
  }

  function onPointerEnd(event: PointerEvent, cancelled: boolean): void {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      /* 忽略 */
    }

    const dragged = dragIndex;
    const didMove = moved;

    if (pointers.size === 0) {
      dragIndex = -1;
      panning = false;
      pinch = null;
      panAnchor = null;
      downPoint = null;

      if (!cancelled && dragged >= 0 && !didMove) {
        const node = model.nodes[dragged]!;
        if (node.url) {
          window.location.href = node.url;
          return;
        }
      }

      if (dragged >= 0 && didMove) {
        // 放手后把这个节点钉住：用户放哪儿就留在哪儿，剩下的邻居再慢慢归位
        const node = model.nodes[dragged]!;
        node.fixed = true;
        node.vx = 0;
        node.vy = 0;
        wake(0.2);
      } else if (layout.isActive()) startLoop();

      if (event.pointerType === 'touch' || cancelled) {
        hover = -1;
        hideTip();
      } else {
        const point = pointOf(event);
        hover = nodeAt(point);
        if (hover >= 0) showTip(hover, point);
        else hideTip();
      }
      refreshCursor();
      requestPaint();
      return;
    }

    // 捏合之后松掉一根手指：剩下一根重新当平移起点，且不再算「点按」
    pinch = null;
    dragIndex = -1;
    panning = true;
    moved = true;
    const remaining = Array.from(pointers.values())[0]!;
    panAnchor = { x: remaining.x, y: remaining.y };
    downPoint = { x: remaining.x, y: remaining.y };
    refreshCursor();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', (event) => onPointerEnd(event, false));
  canvas.addEventListener('pointercancel', (event) => onPointerEnd(event, true));
  canvas.addEventListener('pointerleave', () => {
    if (pointers.size > 0) return;
    if (hover === -1) return;
    hover = -1;
    hideTip();
    refreshCursor();
    requestPaint();
  });

  canvas.addEventListener(
    'wheel',
    (event: WheelEvent) => {
      if (!started) return;
      event.preventDefault();
      rect = canvas.getBoundingClientRect();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvasHeight : 1;
      const delta = clamp(event.deltaY * unit, -320, 320);
      if (!delta) return;
      scaleAt(pointOf(event), view.scale * Math.exp(-delta * 0.0021));
      hideTip();
      requestPaint();
    },
    // 滚轮缩放要 preventDefault，所以只能显式声明非 passive
    { passive: false },
  );

  /* — 控制按钮 ——————————————————————————— */

  function zoomByCenter(factor: number): void {
    if (!started) return;
    scaleAt({ x: canvasWidth / 2, y: canvasHeight / 2 }, view.scale * factor);
    hideTip();
    requestPaint();
  }

  qs<HTMLButtonElement>('[data-graph-zoom-in]', panel)?.addEventListener('click', () => zoomByCenter(ZOOM_STEP));
  qs<HTMLButtonElement>('[data-graph-zoom-out]', panel)?.addEventListener('click', () => zoomByCenter(1 / ZOOM_STEP));
  qs<HTMLButtonElement>('[data-graph-reset]', panel)?.addEventListener('click', () => {
    if (!started) return;
    view = fitView();
    interacted = false;
    hover = -1;
    hideTip();
    refreshCursor();
    requestPaint();
  });

  /* — 尺寸变化 ——————————————————————————— */

  function handleResize(): void {
    const previousWidth = canvasWidth;
    const previousHeight = canvasHeight;
    rect = null;
    applyHeight(); // 跨过断点时高度由 CSS 接管/交回内联
    if (!measure()) return; // 容器被隐藏 / 尺寸为 0：静默等待下一次
    if (!started) {
      start();
      return;
    }
    if (interacted && previousWidth > 1 && previousHeight > 1) {
      // 保住画布中心对应的世界坐标，改尺寸时视线不跑
      const worldX = (previousWidth / 2 - view.tx) / view.scale;
      const worldY = (previousHeight / 2 - view.ty) / view.scale;
      view.tx = canvasWidth / 2 - worldX * view.scale;
      view.ty = canvasHeight / 2 - worldY * view.scale;
    } else {
      view = fitView();
    }
    paint();
  }

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => handleResize());
    observer.observe(panel);
  } else {
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
  }

  // 滚一下页面，canvas 的 client 位置就变了，缓存的包围盒要作废
  onScroll(() => {
    rect = null;
  });

  /* — 主题 ——————————————————————————————— */

  document.addEventListener('ink:themechange', () => {
    painter.refresh(panel);
    paint();
  });

  // 字体加载完成后标签宽度会变，补画一帧
  try {
    void document.fonts?.ready.then(() => {
      if (started) paint();
    });
  } catch {
    /* 老浏览器没有 document.fonts */
  }

  /* — 进场后再动 ———————————————————————— */

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        visible = true;
        if (started) wake(WARMUP_ALPHA);
        else start();
      },
      { rootMargin: '240px 0px', threshold: 0 },
    );
    observer.observe(panel);
  } else {
    visible = true;
    start();
  }
}
