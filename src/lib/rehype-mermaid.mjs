/**
 * Turn ```mermaid fenced blocks into a placeholder that the client can render.
 * The raw source is kept in a data attribute (and as visible <pre> fallback when
 * JavaScript is unavailable) so diagrams can be re-rendered when the theme changes.
 */

function textContent(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (Array.isArray(node.children)) return node.children.map(textContent).join('');
  return '';
}

function walk(node, cb) {
  if (!node || !Array.isArray(node.children)) return;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (cb(child, node, i)) continue;
    walk(child, cb);
  }
}

const makeBlock = (raw) => ({
  type: 'element',
  tagName: 'div',
  properties: {
    className: ['mermaid-block'],
    'data-mermaid': raw.trim(),
    role: 'img',
    'aria-label': 'Mermaid 图表',
  },
  children: [
    {
      type: 'element',
      tagName: 'pre',
      properties: { className: ['mermaid-fallback'] },
      children: [{ type: 'text', value: raw.trim() }],
    },
  ],
});

export function rehypeMermaid() {
  return (tree) => {
    walk(tree, (child, parent, index) => {
      if (child.type !== 'element' || child.tagName !== 'pre') return false;

      const classes = child.properties?.className || [];
      const lang = child.properties?.dataLanguage || child.properties?.['data-language'];
      const code = (child.children || []).find(
        (c) => c.type === 'element' && c.tagName === 'code',
      );
      const codeClasses = code?.properties?.className || [];

      // 语法高亮之前：<pre><code class="language-mermaid">
      const preHighlight = Array.isArray(codeClasses)
        ? codeClasses.includes('language-mermaid')
        : String(codeClasses).includes('language-mermaid');

      // 语法高亮之后：<pre class="astro-code" data-language="mermaid">
      const postHighlight = lang === 'mermaid' || classes.includes?.('language-mermaid');

      if (!preHighlight && !postHighlight) return false;

      parent.children[index] = makeBlock(preHighlight ? textContent(code) : textContent(child));
      return true;
    });
  };
}
