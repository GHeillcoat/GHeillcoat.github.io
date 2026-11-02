/**
 * Obsidian 里的几种写法，转成站点能渲染的结构：
 *   - ==高亮==        → <mark>
 *   - %%注释%%       → 去掉
 *   - 单独一行 ^块ID  → 去掉（Obsidian 的块引用锚点）
 *   - <table>        → 包一层可横向滚动的容器
 *
 * 内联脚注 `^[...]` 在 mdast 阶段处理，见 ./remark-inline-footnotes.mjs。
 */

const SKIP_TAGS = new Set(['code', 'pre', 'script', 'style', 'a', 'svg', 'kbd']);

function textOf(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  if (Array.isArray(node.children)) return node.children.map(textOf).join('');
  return '';
}

function splitHighlights(value) {
  const out = [];
  const re = /==([^=\n]+)==/g;
  let last = 0;
  let match;
  while ((match = re.exec(value))) {
    if (match.index > last) out.push({ type: 'text', value: value.slice(last, match.index) });
    out.push({
      type: 'element',
      tagName: 'mark',
      properties: {},
      children: [{ type: 'text', value: match[1] }],
    });
    last = match.index + match[0].length;
  }
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) });
  return out.length ? out : null;
}

function walk(node, onElement) {
  if (!Array.isArray(node.children)) return;
  const next = [];
  for (const child of node.children) {
    if (child.type === 'element' && SKIP_TAGS.has(child.tagName)) {
      next.push(child);
      continue;
    }
    if (child.type === 'text') {
      const withoutComments = child.value.replace(/%%[^%]*%%/g, '');
      const parts = splitHighlights(withoutComments);
      if (parts) next.push(...parts);
      else if (withoutComments) next.push({ ...child, value: withoutComments });
      continue;
    }
    walk(child, onElement);
    onElement(child, node);
    next.push(child);
  }
  node.children = next;
}

export function rehypeObsidianExtras() {
  return (tree) => {
    walk(tree, (child, parent) => {
      // 去掉只包含块 ID 的段落
      if (child.type === 'element' && child.tagName === 'p') {
        const content = textOf(child).trim();
        if (/^\^[A-Za-z0-9_-]+$/.test(content)) {
          child.__drop = true;
        }
      }
      // 表格包一层横向滚动容器
      if (child.type === 'element' && child.tagName === 'table') {
        if (
          parent.type === 'element' &&
          parent.tagName === 'div' &&
          parent.properties?.className?.includes?.('table-scroll')
        ) {
          return;
        }
        child.__wrap = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'] },
          children: [child],
        };
      }
    });

    // 第二遍处理包装/删除（避免遍历时替换正在遍历的数组）
    const apply = (node) => {
      if (!Array.isArray(node.children)) return;
      const next = [];
      for (const child of node.children) {
        apply(child);
        if (child.__drop) continue;
        if (child.__wrap) {
          next.push(child.__wrap);
          continue;
        }
        next.push(child);
      }
      node.children = next;
    };
    apply(tree);
  };
}
