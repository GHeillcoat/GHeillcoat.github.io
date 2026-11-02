/**
 * 「笔记库」索引：把 src/content/posts 当成一个 Obsidian vault 来读。
 *
 * - 构建期扫描文章文件，解析 YAML 元数据（兼容 Obsidian properties 与 Hexo frontmatter）；
 * - 提供 [[双链]] 的解析：文件名、标题、别名都能命中；
 * - 提供双链抽取与反向链接计算，供知识图谱与「关联」区块使用；
 * - 扫描结果做一个很短的 TTL 缓存，dev 下改文章 1 秒内生效。
 *
 * 元数据兼容：
 *   title / aliases / alias
 *   date / pubDate / created / created_at        → 发布日期
 *   updated / modified / updatedDate / lastmod   → 更新日期
 *   tags / tag（字符串或数组）
 *   categories / category（字符串或数组）
 *   draft / publish(false)
 *
 * 这个模块只在构建期（Node）运行，不会进浏览器 bundle。
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

const POSTS_DIR = path.resolve('src/content/posts');
const PUBLIC_DIR = path.resolve('public');
const CACHE_TTL = 800;

const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|avif)$/i;

export function normalizeKey(value) {
  return String(value)
    .replace(/^\uFEFF/, '')
    .normalize('NFC')
    .trim()
    .replace(/^\.\//, '')
    .replace(/^\/?posts\//, '')
    .replace(/\.(md|mdx)$/i, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function toList(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap((item) => toList(item));
  const text = String(value).trim();
  if (!text) return [];
  // "a, b" / "a、b" 也拆开
  return text
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstDate(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    const date = value instanceof Date ? value : new Date(String(value));
    if (!Number.isNaN(date.valueOf())) return date;
  }
  return null;
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.md') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(md|mdx)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

/** 拆 frontmatter：容忍 BOM、CRLF、空 frontmatter */
export function splitFrontmatter(raw) {
  const text = String(raw).replace(/^\uFEFF/, '');
  if (!text.startsWith('---')) return { data: {}, body: text };
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {}, body: text };
  let data = {};
  try {
    data = parseYaml(match[1]) ?? {};
  } catch {
    data = {};
  }
  return { data, body: text.slice(match[0].length) };
}

/** 把 YAML 元数据归一成站点内部使用的形状（与 content.config.ts 的 transform 保持一致） */
export function normalizeMeta(data, fallbackTitle) {
  const tags = [...toList(data.tags), ...toList(data.tag)];
  const categories = [...toList(data.categories), ...toList(data.category)];
  const published = firstDate(data.pubDate, data.date, data.created, data.created_at);
  const updated = firstDate(data.updatedDate, data.updated, data.modified, data.lastmod);
  const draft = data.draft === true || data.publish === false;

  return {
    title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : fallbackTitle,
    aliases: [...toList(data.aliases), ...toList(data.alias)],
    tags: [...new Set(tags)],
    categories: [...new Set(categories)],
    category: categories[0] ?? '随笔',
    published,
    updated,
    description: typeof data.description === 'string' ? data.description : '',
    draft,
    cover: typeof data.cover === 'string' ? data.cover : '',
    cssclasses: toList(data.cssclasses),
    permalink: typeof data.permalink === 'string' ? data.permalink : '',
  };
}

let cache = { at: 0, index: null };

function build() {
  const files = walk(POSTS_DIR);
  const entries = [];
  const byKey = new Map();

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, body } = splitFrontmatter(raw);
    const rel = path.relative(POSTS_DIR, file).replace(/\\/g, '/');
    const id = rel.replace(/\.(md|mdx)$/i, '');
    const meta = normalizeMeta(data, id);
    if (meta.draft) continue;

    const entry = {
      id,
      title: meta.title,
      aliases: meta.aliases,
      tags: meta.tags,
      category: meta.category,
      categories: meta.categories,
      published: meta.published,
      updated: meta.updated,
      description: meta.description,
      url: `/posts/${id}`,
      body,
    };
    entries.push(entry);

    // 命中优先级：id（含路径）→ 标题 → 别名
    for (const key of [id, entry.title, ...entry.aliases]) {
      const normalized = normalizeKey(key);
      if (normalized && !byKey.has(normalized)) byKey.set(normalized, entry);
    }
    const dashedTitle = normalizeKey(entry.title).replace(/\s+/g, '-');
    if (dashedTitle && !byKey.has(dashedTitle)) byKey.set(dashedTitle, entry);
  }

  return { entries, byKey };
}

export function getVault() {
  const now = Date.now();
  if (cache.index && now - cache.at < CACHE_TTL) return cache.index;
  const index = build();
  cache = { at: now, index };
  return index;
}

/** 解析 [[目标]]：返回文章条目，找不到返回 null */
export function resolveNote(target) {
  const { byKey } = getVault();
  const key = normalizeKey(target);
  if (!key) return null;
  return byKey.get(key) ?? null;
}

/** 解析 ![[图片]]：返回 public 下的绝对路径，找不到返回 null */
export function resolveAsset(target) {
  const name = String(target).trim().replace(/^\.\//, '');
  const candidates = [
    path.join(PUBLIC_DIR, 'images', 'posts', name),
    path.join(PUBLIC_DIR, 'images', 'art', name),
    path.join(PUBLIC_DIR, 'images', name),
    path.join(PUBLIC_DIR, name),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return `/${path.relative(PUBLIC_DIR, candidate).replace(/\\/g, '/')}`;
    }
  }
  return null;
}

export function isImageName(target) {
  return IMAGE_EXT.test(String(target).trim());
}

/** 从 Markdown 正文里抽取双链（含嵌入），返回去重后的目标文本 */
export function extractWikiTargets(body) {
  const targets = new Set();
  if (!body) return [];
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const re = /!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
  let match;
  while ((match = re.exec(text))) {
    const target = match[1].trim();
    if (target) targets.add(target);
  }
  return [...targets];
}

/** 把一个正文里的双链解析成文章 id（数组） */
export function resolveTargets(body) {
  const ids = [];
  for (const target of extractWikiTargets(body)) {
    const note = resolveNote(target);
    if (note && !ids.includes(note.id)) ids.push(note.id);
  }
  return ids;
}
