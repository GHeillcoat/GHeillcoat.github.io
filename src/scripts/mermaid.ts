/**
 * Mermaid 按需渲染。
 *
 * - 只有页面里真的存在 `.mermaid-block[data-mermaid]` 时才动态 `import('mermaid')`；
 * - 首帧之后再逐张渲染，不拖慢首屏；
 * - 深浅墨色取自 CSS 变量，`ink:themechange` 后重绘已渲染的图；
 * - 任何失败都退回到源码 `<pre>`（CSS 用 `.is-failed` 给出提示）。
 */

import { qsa } from './lib/dom';

interface MermaidApi {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, source: string) => Promise<{ svg: string }>;
}

let api: MermaidApi | null = null;
let loading: Promise<MermaidApi | null> | null = null;
let counter = 0;

async function loadMermaid(): Promise<MermaidApi | null> {
  if (loading) return loading;
  loading = (async () => {
    try {
      const module = (await import('mermaid')) as { default?: MermaidApi } & MermaidApi;
      api = module.default ?? (module as unknown as MermaidApi);
      return api;
    } catch {
      return null;
    }
  })();
  return loading;
}

function cssVar(name: string, fallback: string): string {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}

function isDark(): boolean {
  return document.documentElement.dataset.theme === 'dark';
}

function themeVariables(): Record<string, unknown> {
  const dark = isDark();
  const paper = cssVar('--paper', dark ? '#14130f' : '#f6f2e8');
  const raised = cssVar('--paper-raised', dark ? '#1a1814' : '#fbf8f0');
  const sunken = cssVar('--paper-sunken', dark ? '#100f0c' : '#efe9da');
  const ink = cssVar('--ink', dark ? '#e8e1d2' : '#24211c');
  const inkSoft = cssVar('--ink-soft', dark ? '#c6bda9' : '#4b453b');
  const inkMute = cssVar('--ink-mute', dark ? '#928a7b' : '#7f7666');
  const line = cssVar('--line', dark ? '#2c2922' : '#e2d9c6');
  const lineStrong = cssVar('--line-strong', dark ? '#3d382e' : '#d1c5ab');
  const accent = cssVar('--cinnabar', dark ? '#c47b68' : '#9c4033');

  return {
    darkMode: dark,
    background: paper,
    primaryColor: raised,
    primaryTextColor: ink,
    primaryBorderColor: lineStrong,
    secondaryColor: sunken,
    secondaryTextColor: inkSoft,
    secondaryBorderColor: line,
    tertiaryColor: sunken,
    tertiaryTextColor: inkMute,
    tertiaryBorderColor: line,
    mainBkg: raised,
    nodeBorder: lineStrong,
    nodeTextColor: ink,
    textColor: ink,
    lineColor: lineStrong,
    edgeLabelBackground: paper,
    clusterBkg: sunken,
    clusterBorder: line,
    titleColor: ink,
    labelTextColor: ink,
    actorTextColor: ink,
    signalColor: inkMute,
    signalTextColor: ink,
    noteBkgColor: sunken,
    noteTextColor: inkSoft,
    noteBorderColor: line,
    accentColor: accent,
    altBackground: sunken,
  };
}

/**
 * 图的「纸墨」补丁样式。
 *
 * mermaid 12 默认用 neo look：节点描边带一层 `drop-shadow(1px 2px 2px rgba(185,185,185,1))`，
 * 在夜墨里就是一圈发亮的荧光；时序图的信号线/箭头也是浅色。
 * 这里：
 *   - 关掉所有 filter（不走 neo）；
 *   - 线、箭头统一压到淡墨，1px；
 *   - 时序图的消息线/箭头/角色统一用纸墨色；
 *   - 边标签底色用纸色，压住背后的连线。
 */
function inkThemeCSS(): string {
  const paper = cssVar('--paper', '#f6f2e8');
  const raised = cssVar('--paper-raised', '#fbf8f0');
  const sunken = cssVar('--paper-sunken', '#efe9da');
  const line = cssVar('--line', '#e2d9c6');
  const lineStrong = cssVar('--line-strong', '#d1c5ab');
  const inkSoft = cssVar('--ink-soft', '#4b453b');
  const inkMute = cssVar('--ink-mute', '#7f7666');

  return `
    .node rect, .node circle, .node ellipse, .node polygon, .node path,
    .cluster rect, .icon-shape .icon { filter: none !important; }
    .node rect, .node circle, .node ellipse, .node polygon, .node path { stroke-width: 1px; }
    .arrowheadPath { fill: ${lineStrong} !important; stroke: ${lineStrong} !important; }
    .marker, .marker.cross, marker path { fill: ${lineStrong}; stroke: ${lineStrong}; }
    .edgePath .path, .flowchart-link { stroke-width: 1px; }
    .edge-thickness-normal { stroke-width: 1px; }
    .edgeLabel, .edgeLabel p, .edgeLabel rect, .labelBkg { background-color: ${paper} !important; }
    .edgeLabel .label text, .edgeLabel span { fill: ${inkMute}; color: ${inkMute}; }
    .nodeLabel, .nodeLabel p { line-height: 1.4 !important; margin: 0 !important; }

    /* 时序图：线、箭头统一压到淡墨，别在夜里发亮 */
    .messageLine0, .messageLine1 { stroke: ${inkMute} !important; stroke-width: 1px !important; }
    .messageText { fill: ${inkSoft} !important; stroke: none !important; }
    .actor { fill: ${raised} !important; stroke: ${lineStrong} !important; stroke-width: 1px !important; }
    .actor-line { stroke: ${line} !important; stroke-width: 1px !important; }
    .labelBox { fill: ${raised} !important; stroke: ${lineStrong} !important; stroke-width: 1px !important; }
    .labelText, .loopText, .loopLabel { fill: ${inkSoft} !important; }
    .loopLine { stroke: ${lineStrong} !important; stroke-width: 1px !important; }
    .note { fill: ${sunken} !important; stroke: ${line} !important; }
    .noteText { fill: ${inkSoft} !important; }
    .activation0, .activation1, .activation2 { fill: ${sunken} !important; stroke: ${lineStrong} !important; }
  `;
}

function configure(mermaid: MermaidApi): void {
  let fontFamily = 'serif';
  try {
    fontFamily = getComputedStyle(document.body).fontFamily || fontFamily;
  } catch {
    /* 忽略 */
  }
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    // 不要 neo look：它的投影在暗色下会变成荧光边
    look: 'classic',
    themeVariables: themeVariables(),
    themeCSS: inkThemeCSS(),
    fontSize: 15,
    fontFamily,
    securityLevel: 'strict',
    htmlLabels: false,
    // mermaid 12 的默认布局是 ELK（会额外拉 1.4MB 的 elk chunk）。
    // 本站只画 flowchart / sequence 这类简单图，dagre 足够，且小得多。
    layout: 'dagre',
    flowchart: {
      defaultRenderer: 'dagre-wrapper',
      curve: 'basis',
      useMaxWidth: true,
      htmlLabels: false,
      padding: 12,
      // 中文标签比拉丁宽，放宽换行阈值，避免出现「源/文件」这种孤字折行
      wrappingWidth: 240,
    },
    state: { layout: 'dagre' },
    sequence: { useMaxWidth: true, actorMargin: 60 },
    gantt: { useMaxWidth: true },
    er: { useMaxWidth: true },
    journey: { useMaxWidth: true },
  });
}

function cleanupStray(id: string, block: HTMLElement): void {
  // mermaid 解析时会往 body 里塞临时节点，正常情况下它会自己清掉；这里兜底。
  for (const strayId of [id, `d${id}`]) {
    const stray = document.getElementById(strayId);
    if (stray && !block.contains(stray)) stray.remove();
  }
}

async function renderBlock(block: HTMLElement): Promise<void> {
  const source = (block.dataset.mermaid ?? '').trim();
  if (!source) return;

  const mermaid = await loadMermaid();
  if (!mermaid) {
    block.classList.add('is-failed');
    return;
  }

  block.classList.add('is-rendering');
  block.classList.remove('is-rendered', 'is-failed');
  for (const svg of Array.from(block.querySelectorAll('svg'))) svg.remove();

  const id = `ink-mermaid-${++counter}`;
  try {
    // 先等字体就绪：mermaid 会用当前字体测量标签宽度，
    // 字体没加载完就测量会让中文标签过早折行（出现孤字换行）
    if (document.fonts?.ready) await document.fonts.ready.catch(() => undefined);
    configure(mermaid);
    const { svg } = await mermaid.render(id, source);
    if (!svg) throw new Error('empty svg');
    block.insertAdjacentHTML('beforeend', svg);
    block.classList.add('is-rendered');
    block.classList.remove('is-failed');
  } catch {
    block.classList.add('is-failed');
    block.classList.remove('is-rendered');
  } finally {
    block.classList.remove('is-rendering');
    cleanupStray(id, block);
  }
}

/** 每块图排一条队列：主题切换与首屏渲染撞在一起时不会插进两个 svg */
const chains = new WeakMap<HTMLElement, Promise<void>>();

function enqueueRender(block: HTMLElement): Promise<void> {
  const previous = chains.get(block) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() => renderBlock(block));
  chains.set(block, next);
  return next;
}

export function initMermaid(): void {
  const blocks = qsa<HTMLElement>('.mermaid-block[data-mermaid]');
  if (!blocks.length) return;

  const queued = new Set<HTMLElement>();
  const queue: HTMLElement[] = [];
  let draining = false;

  const drain = async () => {
    if (draining) return;
    draining = true;
    while (queue.length) {
      const block = queue.shift();
      if (block) await enqueueRender(block);
    }
    draining = false;
  };

  const schedule = (block: HTMLElement) => {
    if (queued.has(block)) return; // 已排队 / 已渲染的不重复
    queued.add(block);
    queue.push(block);
    void drain();
  };

  if ('IntersectionObserver' in window) {
    // 图块接近视口才 import('mermaid')——首屏下方很远的图不下载任何 Mermaid 代码
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          schedule(entry.target as HTMLElement);
        }
      },
      { rootMargin: '200px 0px', threshold: 0 },
    );
    for (const block of blocks) observer.observe(block);
  } else {
    for (const block of blocks) schedule(block);
  }

  document.addEventListener('ink:themechange', () => {
    for (const block of blocks) {
      const drawn = block.classList.contains('is-rendered');
      const failed = block.classList.contains('is-failed');
      if (drawn || failed) void enqueueRender(block);
    }
  });
}



