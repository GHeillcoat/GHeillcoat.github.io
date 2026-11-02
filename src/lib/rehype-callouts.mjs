/**
 * Obsidian / GitHub 风格的 callout：
 *
 *   > [!note] 标题
 *   > 正文……
 *
 *   > [!warning]- 默认折叠
 *   > 正文……
 *
 * 会被渲染成：
 *   <div class="callout callout--note" data-callout="note">
 *     <p class="callout-title"><span class="callout-title-text">标题</span></p>
 *     <div class="callout-content">…</div>
 *   </div>
 *
 * 折叠语法（`-` / `+`）用 <details>/<summary> 实现。
 */

const TYPE_ALIASES = {
  note: 'note',
  abstract: 'abstract',
  summary: 'abstract',
  tldr: 'abstract',
  info: 'info',
  todo: 'todo',
  tip: 'tip',
  hint: 'tip',
  important: 'tip',
  success: 'success',
  check: 'success',
  done: 'success',
  question: 'question',
  help: 'question',
  faq: 'question',
  warning: 'warning',
  caution: 'warning',
  attention: 'warning',
  failure: 'failure',
  fail: 'failure',
  missing: 'failure',
  danger: 'danger',
  error: 'danger',
  bug: 'bug',
  example: 'example',
  quote: 'quote',
  cite: 'quote',
};

const DEFAULT_TITLES = {
  note: '笔记',
  abstract: '摘要',
  info: '信息',
  todo: '待办',
  tip: '提示',
  success: '完成',
  question: '疑问',
  warning: '注意',
  failure: '失败',
  danger: '危险',
  bug: '缺陷',
  example: '例子',
  quote: '引文',
};

const MARKER = /^\s*\[!([a-zA-Z-]+)\]([+-]?)[^\S\n]*([^\n]*)(?:\n([\s\S]*))?$/;

function element(tagName, properties, children = []) {
  return { type: 'element', tagName, properties, children };
}

function text(value) {
  return { type: 'text', value };
}

function getFirstText(node) {
  if (!node || node.type !== 'element') return null;
  const first = (node.children || []).find((child) => child.type === 'text' && child.value.trim());
  if (!first) return null;
  return first;
}

function isEmptyParagraph(node) {
  return (
    node.type === 'element' &&
    node.tagName === 'p' &&
    (node.children || []).every((child) => child.type !== 'text' || !child.value.trim())
  );
}

export function rehypeCallouts() {
  return (tree) => {
    const visit = (node) => {
      if (!Array.isArray(node.children)) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === 'element' && child.tagName === 'blockquote') {
          const replaced = convert(child);
          if (replaced) {
            node.children[i] = replaced;
            continue;
          }
        }
        visit(child);
      }
    };
    visit(tree);
  };
}

function convert(blockquote) {
  const children = blockquote.children || [];
  const firstParagraph = children.find((child) => child.type === 'element' && child.tagName === 'p');
  if (!firstParagraph) return null;

  const firstText = getFirstText(firstParagraph);
  if (!firstText) return null;

  const match = MARKER.exec(firstText.value);
  if (!match) return null;

  const rawType = match[1].toLowerCase();
  const type = TYPE_ALIASES[rawType];
  if (!type) return null;

  const fold = match[2]; // '-' 折叠、'+' 展开
  // 第一行是标题，同一段里剩下的行才是正文（Obsidian 的写法）
  const title = (match[3] || '').trim() || DEFAULT_TITLES[type] || rawType;
  const restText = (match[4] || '').replace(/\n+/g, ' ').trim();

  // 保留第一段里标题之后的其它节点（行内代码/强调等），并补上剩余文本
  const firstIndex = firstParagraph.children.indexOf(firstText);
  const restOfParagraph = firstParagraph.children
    .flatMap((child, index) => {
      if (index === firstIndex) return restText ? [{ ...child, value: restText }] : [];
      return [{ ...child }];
    })
    .filter((child) => child.type !== 'text' || child.value.trim().length > 0);

  const restBlocks = children.filter((child) => child !== firstParagraph);

  const contentChildren = [];
  if (restOfParagraph.length) contentChildren.push(element('p', {}, restOfParagraph));
  for (const block of restBlocks) {
    if (isEmptyParagraph(block)) continue;
    contentChildren.push(block);
  }

  const titleNode = element('span', { className: ['callout-title-text'] }, [text(title)]);
  const classes = ['callout', `callout--${type}`];

  if (fold) {
    const details = element(
      'details',
      { className: [...classes, 'is-foldable'], 'data-callout': type, open: fold === '+' },
      [
        element('summary', { className: ['callout-title'] }, [titleNode]),
        element('div', { className: ['callout-content'] }, contentChildren),
      ],
    );
    return details;
  }

  return element('div', { className: classes, 'data-callout': type }, [
    element('p', { className: ['callout-title'] }, [titleNode]),
    element('div', { className: ['callout-content'] }, contentChildren),
  ]);
}


