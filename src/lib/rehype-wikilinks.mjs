/**
 * [[双链]] / ![[嵌入]] 的构建期渲染（Obsidian 语法）。
 *
 * - [[文件名]]、[[标题]]、[[别名]] 都能解析到文章；
 * - [[笔记#小节]] 会补上标题锚点（与 rehype-slug 使用同一个 slugger）；
 * - [[笔记|显示文字]] 用别名显示；
 * - ![[图片名]] 会去 public/images 下找同名图片，找不到就渲染成「断链」样式；
 * - 解析不到的链接渲染为 `.is-broken`，不会让构建失败。
 */
import GithubSlugger from 'github-slugger';
import { isImageName, resolveAsset, resolveNote } from './vault.mjs';

const SKIP_TAGS = new Set(['code', 'pre', 'a', 'script', 'style', 'svg', 'kbd']);

function textNode(value) {
  return { type: 'text', value };
}

function parseInner(inner) {
  const pipe = inner.indexOf('|');
  const beforeAlias = pipe === -1 ? inner : inner.slice(0, pipe);
  const alias = pipe === -1 ? '' : inner.slice(pipe + 1).trim();
  const hash = beforeAlias.indexOf('#');
  const target = (hash === -1 ? beforeAlias : beforeAlias.slice(0, hash)).trim();
  const heading = hash === -1 ? '' : beforeAlias.slice(hash + 1).trim();
  return { target, alias, heading };
}

/** 把一段文本里的 wiki 语法切成节点数组 */
function splitText(value) {
  const out = [];
  const re = /(!?)\[\[([^\]\n]+)\]\]/g;
  let last = 0;
  let match;
  while ((match = re.exec(value))) {
    if (match.index > last) out.push(textNode(value.slice(last, match.index)));
    out.push(buildNode(match[1] === '!', match[2]));
    last = match.index + match[0].length;
  }
  if (last < value.length) out.push(textNode(value.slice(last)));
  return out.length ? out : null;
}

function buildNode(embed, inner) {
  const { target, alias, heading } = parseInner(inner);

  if (embed) {
    const asset = isImageName(target) ? resolveAsset(target) : null;
    if (asset) {
      return {
        type: 'element',
        tagName: 'img',
        properties: {
          src: asset,
          alt: alias || target,
          loading: 'lazy',
          decoding: 'async',
          className: ['wiki-embed'],
        },
        children: [],
      };
    }
    return {
      type: 'element',
      tagName: 'span',
      properties: {
        className: ['wiki-link', 'is-broken'],
        title: `没有找到可嵌入的文件：${target}`,
      },
      children: [textNode(`![[${inner}]]`)],
    };
  }

  // [[#小节]]：链到本页的标题锚点（Obsidian 同篇跳转写法）
  if (!target && heading) {
    return {
      type: 'element',
      tagName: 'a',
      properties: {
        href: `#${new GithubSlugger().slug(heading)}`,
        className: ['wiki-link'],
        'data-wiki-target': `#${heading}`,
      },
      children: [textNode(alias || heading)],
    };
  }

  const note = resolveNote(target || heading);
  if (!note) {
    return {
      type: 'element',
      tagName: 'span',
      properties: {
        className: ['wiki-link', 'is-broken'],
        title: `没有找到笔记：${target || inner}`,
      },
      children: [textNode(alias || target || inner)],
    };
  }

  let href = note.url;
  if (heading) {
    href += `#${new GithubSlugger().slug(heading)}`;
  }

  const label = alias || heading || note.title;
  return {
    type: 'element',
    tagName: 'a',
    properties: {
      href,
      className: ['wiki-link'],
      'data-wiki-target': target || heading,
    },
    children: [textNode(label)],
  };
}

function walk(node) {
  if (!Array.isArray(node.children)) return;
  const next = [];
  for (const child of node.children) {
    if (child.type === 'text') {
      const parts = splitText(child.value || '');
      if (parts) next.push(...parts);
      else next.push(child);
      continue;
    }
    if (child.type === 'element' && SKIP_TAGS.has(child.tagName)) {
      next.push(child);
      continue;
    }
    walk(child);
    next.push(child);
  }
  node.children = next;
}

export function rehypeWikiLinks() {
  return (tree) => walk(tree);
}
