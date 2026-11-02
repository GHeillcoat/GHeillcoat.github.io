/**
 * 图谱绘制：一次 clearRect + 几趟批量 path，文字只在需要时绘制。
 *
 * 颜色全部现取 CSS 变量（`--paper`/`--line`/`--ink`/`--cinnabar`/`--gold` …），
 * 主题变化后调用 refresh() 重新取色再重绘，布局不动。
 */

import type { GraphModel, GraphNode } from './graph-model';

export interface View {
  scale: number;
  tx: number;
  ty: number;
}

export interface Palette {
  paper: string;
  line: string;
  lineStrong: string;
  ink: string;
  inkSoft: string;
  inkMute: string;
  cinnabar: string;
  gold: string;
  /** 画布所在容器的底色：用作节点与文字的「纸边」，让连线不插进圆里 */
  surface: string;
  font: string;
}

/** 画布坐标里的矩形（CSS px） */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PaintScene {
  width: number;
  height: number;
  dpr: number;
  view: View;
  model: GraphModel;
  /** 悬停的节点下标，-1 表示没有 */
  hover: number;
  /** 正在拖动的节点下标，-1 表示没有 */
  drag: number;
  /** 不给标签用的区域：控制按钮、提示文字 */
  reserved: Rect[];
}

export interface Painter {
  refresh(panel?: HTMLElement | null): void;
  paint(ctx: CanvasRenderingContext2D, scene: PaintScene): void;
}

const TAU = Math.PI * 2;
const LABEL_SIZE = 12;
const LABEL_SIZE_SMALL = 11;
/** 窄屏（手机）用更小的标签字号 */
const NARROW_WIDTH = 520;
/** 低于这个度数的节点，只在放大或悬停时才露标签 */
const LABEL_MIN_DEGREE = 3;
/** 放大到这个倍数以上，标签全开 */
const LABEL_SCALE = 1.1;
/** 圆点在屏幕上的直径范围：缩小整体视图时不会变成针尖，放大时也不会糊成一块 */
const SCREEN_RADIUS_MIN = 2.6;
const SCREEN_RADIUS_MAX = 24;

/** 节点在屏幕上的半径（CSS px） */
export function screenRadius(node: GraphNode, scale: number): number {
  return Math.min(SCREEN_RADIUS_MAX, Math.max(SCREEN_RADIUS_MIN, node.r * scale));
}

function cssVar(name: string, fallback: string): string {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}

function isTransparent(color: string): boolean {
  const value = color.trim().toLowerCase();
  return !value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)' || value === 'rgba(0,0,0,0)';
}

function readPalette(panel: HTMLElement | null): Palette {
  let surface = '';
  if (panel) {
    try {
      surface = getComputedStyle(panel).backgroundColor;
    } catch {
      surface = '';
    }
  }
  let font = 'serif';
  try {
    font = getComputedStyle(document.body).fontFamily || font;
  } catch {
    /* 取不到就用 serif */
  }

  return {
    paper: cssVar('--paper', '#f6f1e6'),
    line: cssVar('--line', '#ded3ba'),
    lineStrong: cssVar('--line-strong', '#cdbf9f'),
    ink: cssVar('--ink', '#1f1c16'),
    inkSoft: cssVar('--ink-soft', '#423c32'),
    inkMute: cssVar('--ink-mute', '#6b6251'),
    cinnabar: cssVar('--cinnabar', '#9a3f32'),
    gold: cssVar('--gold', '#a08052'),
    surface: isTransparent(surface) ? cssVar('--paper', '#f6f1e6') : surface,
    font,
  };
}

/** 悬停/拖动节点的「一圈邻居」；没有时返回 null（不淡化任何东西） */
function relatedSet(model: GraphModel, index: number): Set<number> | null {
  if (index < 0 || index >= model.nodes.length) return null;
  const set = new Set<number>([index]);
  for (const neighbor of model.neighbors[index] ?? []) set.add(neighbor);
  return set;
}

function addCircle(ctx: CanvasRenderingContext2D, node: GraphNode, radius: number): void {
  ctx.moveTo(node.x + radius, node.y);
  ctx.arc(node.x, node.y, radius, 0, TAU);
}

function fillCircles(ctx: CanvasRenderingContext2D, nodes: GraphNode[], radii: number[], color: string, alpha: number): void {
  if (!nodes.length) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const node of nodes) addCircle(ctx, node, radii[node.index]!);
  ctx.fill();
}

/** 先铺一圈底色再上墨：连线不会顶到圆里，节点边缘更干净 */
function drawGroup(
  ctx: CanvasRenderingContext2D,
  nodes: GraphNode[],
  radii: number[],
  colors: Palette,
  color: string,
  alpha: number,
  scale: number,
): void {
  if (!nodes.length) return;
  const border = Math.max(0, 1.4 / scale);
  ctx.beginPath();
  for (const node of nodes) {
    const radius = radii[node.index]! + border;
    ctx.moveTo(node.x + radius, node.y);
    ctx.arc(node.x, node.y, radius, 0, TAU);
  }
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colors.surface;
  ctx.fill();
  fillCircles(ctx, nodes, radii, color, alpha);
}

function drawRing(ctx: CanvasRenderingContext2D, node: GraphNode, radius: number, color: string, scale: number): void {
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2 / scale;
  ctx.beginPath();
  ctx.arc(node.x, node.y, radius + 3.4 / scale, 0, TAU);
  ctx.stroke();
}

function paintScene(ctx: CanvasRenderingContext2D, scene: PaintScene, colors: Palette): void {
  const { width, height, dpr, view, model } = scene;
  const scale = view.scale > 0 ? view.scale : 1;

  // —— 清屏：整帧只有这一次 clearRect
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, Math.max(1, width * dpr), Math.max(1, height * dpr));
  if (width < 2 || height < 2) return;

  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * view.tx, dpr * view.ty);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const nodes = model.nodes;
  const active = scene.drag >= 0 ? scene.drag : scene.hover;
  const related = relatedSet(model, active);
  const hairline = 1 / scale;
  // 世界半径负责「谁大谁小」，屏幕半径夹在合理区间：缩小时不变成针尖，放大时不糊成一片
  const radii: number[] = new Array(nodes.length).fill(0);
  for (const node of nodes) radii[node.index] = screenRadius(node, scale) / scale;

  // —— 双链：先一趟淡线，再把与高亮节点相连的几条压在上面
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = hairline;
  ctx.globalAlpha = related ? 0.3 : 0.85;
  ctx.beginPath();
  for (const link of model.links) {
    if (related && (link.source === active || link.target === active)) continue;
    const from = nodes[link.source]!;
    const to = nodes[link.target]!;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
  }
  ctx.stroke();

  if (related) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.inkMute;
    ctx.lineWidth = Math.max(hairline, 1.3 / scale);
    ctx.beginPath();
    for (const link of model.links) {
      if (link.source !== active && link.target !== active) continue;
      const from = nodes[link.source]!;
      const to = nodes[link.target]!;
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
    }
    ctx.stroke();
  }

  // —— 节点：按「淡化 / 孤立 / 有链接 / 高亮」分成四组，每组两趟 fill
  const dimmed: GraphNode[] = [];
  const faint: GraphNode[] = [];
  const linked: GraphNode[] = [];
  const highlighted: GraphNode[] = [];
  for (const node of nodes) {
    const hot = node.index === model.focus || (related ? related.has(node.index) : false);
    if (hot) highlighted.push(node);
    else if (related) dimmed.push(node);
    else if (node.degree === 0) faint.push(node);
    else linked.push(node);
  }

  drawGroup(ctx, dimmed, radii, colors, colors.inkMute, 0.3, scale);
  drawGroup(ctx, faint, radii, colors, colors.inkMute, 1, scale);
  drawGroup(ctx, linked, radii, colors, colors.inkSoft, 1, scale);
  drawGroup(ctx, highlighted, radii, colors, colors.cinnabar, 1, scale);

  if (model.focus >= 0) drawRing(ctx, nodes[model.focus]!, radii[model.focus]!, colors.gold, scale);
  if (active >= 0 && active !== model.focus) drawRing(ctx, nodes[active]!, radii[active]!, colors.gold, scale);

  // —— 标签：只画「值得画」的那几个，并做一次简单的防重叠 / 防越界
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const labelSize = width < NARROW_WIDTH ? LABEL_SIZE_SMALL : LABEL_SIZE;
  const labels = pickLabels(scene, ctx, labelSize);
  if (labels.length) {
    ctx.font = `${labelSize}px ${colors.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = colors.surface;
    for (const item of labels) {
      ctx.globalAlpha = item.dim ? 0.32 : 1;
      ctx.strokeText(item.node.label, item.x, item.y);
    }
    for (const item of labels) {
      ctx.globalAlpha = item.dim ? 0.38 : 1;
      ctx.fillStyle = item.hot ? colors.cinnabar : colors.inkSoft;
      ctx.fillText(item.node.label, item.x, item.y);
    }
  }

  ctx.globalAlpha = 1;
}

interface LabelBox {
  node: GraphNode;
  /** 文本左端（居中绘制，所以 x 是中线） */
  x: number;
  y: number;
  hot: boolean;
  dim: boolean;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** measureText 按 (字号, 文本) 缓存：标签与字号都很稳定，没必要每帧重量 */
const labelWidthCache = new Map<string, number>();

function measureLabel(ctx: CanvasRenderingContext2D, label: string, size: number): number {
  const key = `${size}\u0000${label}`;
  const cached = labelWidthCache.get(key);
  if (cached !== undefined) return cached;
  let measured = 0;
  try {
    measured = ctx.measureText(label).width;
  } catch {
    measured = label.length * size * 0.62;
  }
  if (!Number.isFinite(measured) || measured <= 0) measured = label.length * size * 0.62;
  labelWidthCache.set(key, measured);
  return measured;
}

function overlaps(a: { left: number; top: number; right: number; bottom: number }, b: Rect, gap: number): boolean {
  return (
    a.left - gap < b.x + b.width && a.right + gap > b.x && a.top - gap < b.y + b.height && a.bottom + gap > b.y
  );
}

/**
 * 挑出这一帧要画的标签：
 * 1. 只在 hover / 焦点 / 度数 ≥ 3 / 放大到 1.1 倍以上时画（局部图谱节点少，全画）；
 * 2. 文字整体夹在画布内，贴边的标签不会只剩半行；
 * 3. 控制按钮与提示文字所在区域留空；
 * 4. 相互压住的标签只留优先级高的（悬停 > 度数高 > 半径大）。
 */
function pickLabels(
  scene: PaintScene,
  ctx: CanvasRenderingContext2D,
  labelSize: number,
): LabelBox[] {
  const { model, view, width, height, reserved } = scene;
  const { scale } = view;
  const related = relatedSet(model, scene.drag >= 0 ? scene.drag : scene.hover);
  const boxHeight = labelSize + 6;

  const candidates: LabelBox[] = [];
  for (const node of model.nodes) {
    const hot = node.index === model.focus || (related ? related.has(node.index) : false);
    const important = hot || node.degree >= LABEL_MIN_DEGREE || scale > LABEL_SCALE;
    const local = model.focus >= 0;
    if (!important && !local) continue;

    const cx = node.x * scale + view.tx;
    const cy = node.y * scale + view.ty;
    if (cx < -140 || cx > width + 140 || cy < -60 || cy > height + 60) continue;

    const textWidth = measureLabel(ctx, node.label, labelSize);
    if (textWidth + 12 > width) continue;

    const half = textWidth / 2 + 3;
    const x = Math.min(Math.max(cx, half + 2), width - half - 2);
    const radius = screenRadius(node, scale);
    let y = cy + radius + 5;
    if (y + boxHeight > height - 6) y = cy - radius - 5 - boxHeight;
    y = Math.min(Math.max(y, 2), Math.max(2, height - boxHeight - 2));

    const box = { left: x - half, right: x + half, top: y, bottom: y + boxHeight };
    if (reserved.some((region) => overlaps(box, region, 4))) continue;

    candidates.push({ node, x, y, hot, dim: Boolean(related) && !hot, ...box });
  }

  const score = (box: LabelBox): number => (box.hot ? 1_000_000 : 0) + box.node.degree * 1_000 + box.node.r;
  candidates.sort((a, b) => score(b) - score(a));

  const kept: LabelBox[] = [];
  for (const candidate of candidates) {
    const collides = kept.some((other) => overlaps(candidate, toRect(other), 2));
    if (!collides) kept.push(candidate);
  }
  return kept;
}

function toRect(box: LabelBox): Rect {
  return { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top };
}

export function createPainter(): Painter {
  let colors = readPalette(null);
  return {
    refresh(panel) {
      colors = readPalette(panel ?? null);
      // 字体/主题变了，量出来的文字宽度也要重算
      labelWidthCache.clear();
    },
    paint(ctx, scene) {
      paintScene(ctx, scene, colors);
    },
  };
}
