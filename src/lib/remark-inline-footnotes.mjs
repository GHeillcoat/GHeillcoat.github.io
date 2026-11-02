/**
 * Obsidian 内联脚注 `^[内容]`。
 *
 * 必须在 remark（mdast）阶段做：GFM 的 autolink 会把内容里的裸 URL 先切成
 * link 节点，等到 rehype 文本阶段已经看不到完整的 `^[...]` 了。
 *
 * 内容里可能还有 Obsidian 双链 `[[…]]`，所以闭合括号要按「方括号深度」找，
 * 不能遇到第一个 `]` 就收尾。
 *
 * 渲染成：正文里的上标数字 + 文末「注」列表，两条互相跳转。
 */

function html(value) {
  return { type: 'html', value };
}

const BLOCK_SKIP = new Set(['code', 'inlineCode', 'html', 'table']);

function plainText(node) {
  if (node.type === 'text') return node.value;
  if (Array.isArray(node.children)) return node.children.map(plainText).join('');
  return '';
}

/** 把节点截成「前 length 个字符」的样子：链接保留前缀作为 href，其它退化成文本 */
function prefixNode(node, text) {
  if (!text) return null;
  if (node.type === 'text') return { type: 'text', value: text };
  if (node.type === 'link') {
    return {
      type: 'link',
      url: /^https?:\/\//.test(text.trim()) ? text.trim() : node.url,
      title: null,
      children: [{ type: 'text', value: text }],
    };
  }
  return { type: 'text', value: text };
}

/** 从第 i 个节点的第 char 个字符开始，按方括号深度找闭合的 `]` */
function findClose(nodes, fromNode, fromChar) {
  let depth = 1; // `^[` 已经打开一层
  for (let n = fromNode; n < nodes.length; n += 1) {
    const value = plainText(nodes[n]);
    const start = n === fromNode ? fromChar : 0;
    for (let k = start; k < value.length; k += 1) {
      const ch = value[k];
      if (ch === '[') depth += 1;
      else if (ch === ']') {
        depth -= 1;
        if (depth === 0) return { node: n, char: k };
      }
    }
  }
  return null;
}

function extract(nodes, state) {
  const out = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];
    if (node.type !== 'text' || !node.value.includes('^[')) {
      out.push(node);
      i += 1;
      continue;
    }

    const value = node.value;
    const start = value.indexOf('^[');
    const contentStart = start + 2;
    const close = findClose(nodes, i, contentStart);

    if (!close) {
      // 没有闭合，原样保留，别把正文吃掉
      if (start > 0) out.push({ type: 'text', value: value.slice(0, start) });
      out.push({ type: 'text', value: value.slice(start) });
      i += 1;
      continue;
    }

    if (start > 0) out.push({ type: 'text', value: value.slice(0, start) });

    // 收集 [i, close.node] 之间的内容
    const collected = [];
    for (let n = i; n <= close.node; n += 1) {
      const text = plainText(nodes[n]);
      const from = n === i ? contentStart : 0;
      const to = n === close.node ? close.char : text.length;
      const slice = text.slice(from, to);
      const part = prefixNode(nodes[n], slice);
      if (part) collected.push(part);
    }

    out.push(state.ref(collected));

    // 闭合符后面可能还有正文，甚至还有下一个 ^[...]：塞回队列继续扫
    const tail = plainText(nodes[close.node]).slice(close.char + 1);
    if (tail) {
      nodes.splice(close.node + 1, 0, { type: 'text', value: tail });
    }
    i = close.node + 1;
  }

  return out;
}

const INLINE_CONTAINERS = new Set([
  'paragraph',
  'heading',
  'tableCell',
  'strong',
  'emphasis',
  'delete',
]);

function walkBlocks(node, state) {
  if (!Array.isArray(node.children)) return;
  if (BLOCK_SKIP.has(node.type)) return;

  if (INLINE_CONTAINERS.has(node.type)) {
    node.children = extract(node.children, state);
  }
  for (const child of node.children) walkBlocks(child, state);
}

export function remarkInlineFootnotes() {
  return (tree) => {
    const notes = [];
    const state = {
      ref(children) {
        notes.push(children);
        const n = notes.length;
        return html(
          `<sup class="data-footnote-ref"><a href="#fn-inline-${n}" id="fnref-inline-${n}">${n}</a></sup>`,
        );
      },
    };

    walkBlocks(tree, state);
    if (!notes.length) return;

    const section = [html('<section class="footnotes" data-footnotes><h2 class="sr-only">注释</h2><ol>')];
    notes.forEach((children, index) => {
      const n = index + 1;
      section.push(html(`<li id="fn-inline-${n}">`));
      section.push({
        type: 'paragraph',
        children: [
          ...children,
          { type: 'text', value: ' ' },
          {
            type: 'link',
            url: `#fnref-inline-${n}`,
            title: null,
            children: [{ type: 'text', value: '↩' }],
          },
        ],
      });
      section.push(html('</li>'));
    });
    section.push(html('</ol></section>'));

    tree.children.push(...section);
  };
}
