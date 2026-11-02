/**
 * 图谱数据层：把 `<script type="application/json" data-graph-data>` 里的 JSON
 * 整理成索引化的节点 / 边，并预计算半径、标签与邻居表。
 *
 * 这里不碰 DOM，也不画东西；坏数据（缺 id、悬空边、重复边）在这里就被丢掉，
 * 后面的布局与绘制就可以假定数据是干净的。
 */

export interface GraphNode {
  id: string;
  title: string;
  category: string;
  url: string;
  /** 链接数（入 + 出），决定节点大小 */
  degree: number;
  index: number;
  /** 世界坐标，由布局初始化与更新 */
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 固定不动的节点（局部图谱的中心） */
  fixed: boolean;
  /** 截断后的画布标签 */
  label: string;
}

export interface GraphLink {
  source: number;
  target: number;
}

export type GraphMode = 'global' | 'local';

export interface GraphModel {
  mode: GraphMode;
  nodes: GraphNode[];
  links: GraphLink[];
  /** 邻居表（无向） */
  neighbors: number[][];
  /** 局部图谱的中心节点；-1 表示没有 */
  focus: number;
}

export interface GraphInputNode {
  id: string;
  title: string;
  category: string;
  url: string;
  degree: number;
}

export interface GraphInputLink {
  source: string;
  target: string;
}

export interface GraphInput {
  nodes: GraphInputNode[];
  links: GraphInputLink[];
}

export interface ModelOptions {
  mode: GraphMode;
  focus: string;
}

/** 标签的排版预算（CSS px）：估算字符宽度，比 measureText 便宜且与主题无关 */
const LABEL_BUDGET = 132;
const LABEL_ELLIPSIS = '…';

/**
 * 世界坐标相对 CSS 像素的倍率。
 *
 * 力导向在更大的数值空间里算同样稳，但真正的原因是视口：初始「适配」缩放
 * ≈ 画布宽 / 图的世界跨度。图小时 1 个世界单位就该只有零点几个 CSS 像素，
 * 否则适配缩放会顶到上限 2.5，用户几乎没有放大的余地。
 * 节点半径与所有布局长度都乘这个值 —— 视觉结果不变，只是坐标数值变大。
 */
export const WORLD_SCALE = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOf(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * 解析数据块。任何结构性错误都返回 null，调用方据此静默降级。
 */
export function parseGraphPayload(element: Element | null): GraphInput | null {
  const raw = element?.textContent ?? '';
  if (!raw.trim()) return null;

  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(data) || !Array.isArray(data.nodes)) return null;

  const nodes: GraphInputNode[] = [];
  const known = new Set<string>();
  for (const entry of data.nodes) {
    if (!isRecord(entry)) continue;
    const id = textOf(entry.id);
    if (!id || known.has(id)) continue;
    known.add(id);
    nodes.push({
      id,
      title: textOf(entry.title) || id,
      category: textOf(entry.category),
      url: textOf(entry.url),
      degree: Math.max(0, numberOf(entry.degree, 0)),
    });
  }
  if (nodes.length === 0) return null;

  // 双链在视觉上是无向的：a→b 与 b→a 只画一条线，重复边也只留一条
  const links: GraphInputLink[] = [];
  const pairs = new Set<string>();
  if (Array.isArray(data.edges)) {
    for (const entry of data.edges) {
      if (!isRecord(entry)) continue;
      const source = textOf(entry.source);
      const target = textOf(entry.target);
      if (source === target || !known.has(source) || !known.has(target)) continue;
      const key = source < target ? `${source}\u0000${target}` : `${target}\u0000${source}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      links.push({ source, target });
    }
  }

  return { nodes, links };
}

/** 按估算字宽截断标签；超长标题不该在画布上摊成一排 */
function fitLabel(title: string): string {
  let used = 0;
  let out = '';
  for (const char of title) {
    // 中文/全角按一个字号宽，拉丁按 0.56 估
    const width = char.codePointAt(0)! > 0x2e7f ? 12 : 6.7;
    if (used + width > LABEL_BUDGET) return `${out}${LABEL_ELLIPSIS}`;
    out += char;
    used += width;
  }
  return out;
}

/** 半径只跟链接数有关：度数越高越沉，孤立笔记最轻（世界单位，见 WORLD_SCALE） */
function radiusOf(degree: number): number {
  return (2.6 + Math.min(7.4, Math.sqrt(degree) * 1.75)) * WORLD_SCALE;
}

export function buildModel(input: GraphInput, options: ModelOptions): GraphModel {
  const indexById = new Map<string, number>();
  const nodes: GraphNode[] = input.nodes.map((entry, index) => {
    indexById.set(entry.id, index);
    return {
      id: entry.id,
      title: entry.title,
      category: entry.category,
      url: entry.url,
      degree: entry.degree,
      index,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: radiusOf(entry.degree),
      fixed: false,
      label: fitLabel(entry.title),
    };
  });

  const links: GraphLink[] = [];
  const neighbors: number[][] = nodes.map(() => []);
  const computedDegree = new Array<number>(nodes.length).fill(0);

  for (const entry of input.links) {
    const source = indexById.get(entry.source);
    const target = indexById.get(entry.target);
    if (source === undefined || target === undefined || source === target) continue;
    links.push({ source, target });
    neighbors[source].push(target);
    neighbors[target].push(source);
    computedDegree[source] += 1;
    computedDegree[target] += 1;
  }

  for (const node of nodes) {
    // 数据里的 degree 是全站度数，比子图里重新数的更有信息量；两者取大
    node.degree = Math.max(node.degree, computedDegree[node.index] ?? 0);
    node.r = radiusOf(node.degree);
  }

  const focus = options.mode === 'local' ? indexById.get(options.focus) ?? -1 : -1;
  if (focus >= 0) {
    const center = nodes[focus]!;
    center.r = Math.max(center.r, 9 * WORLD_SCALE);
    center.fixed = true;
    center.x = 0;
    center.y = 0;
  }

  return {
    mode: options.mode === 'local' && focus >= 0 ? 'local' : 'global',
    nodes,
    links,
    neighbors,
    focus,
  };
}
