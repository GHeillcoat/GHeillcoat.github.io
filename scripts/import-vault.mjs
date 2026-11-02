#!/usr/bin/env node
/**
 * 把一个 Obsidian vault 导入成站点的「笔记」集合。
 *
 *   npm run import:vault -- --from "D:/obsidian"
 *
 * 做的事：
 *   - 扫描 vault 里的 .md（跳过 .obsidian / .git / .claude / scripts / _lab / assets/reference）
 *   - 生成规范化 frontmatter：title（取第一个 H1）、date（created 或文件时间）、tags、aliases、category（顶层文件夹）
 *   - 把正文开头的 H1 去掉（页面标题用 frontmatter 渲染，避免重复）
 *   - 图片等附件复制到 public/vault/（![[img.png]] 由站点解析）
 *   - 输出到 src/content/vault/<相对路径>.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { slug as githubSlug } from 'github-slugger';

const args = process.argv.slice(2);
const flag = (name, fallback = '') => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const FROM = path.resolve(flag('from', 'D:/obsidian'));
const TO = path.resolve(flag('to', 'src/content/vault'));
const ASSETS = path.resolve(flag('assets', 'public/vault'));

const SKIP_DIRS = new Set(['.obsidian', '.git', '.claude', 'scripts', '_lab', 'node_modules']);
const SKIP_PREFIXES = ['assets/reference/'];
const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|avif)$/i;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function splitFrontmatter(raw) {
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

function toList(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap((v) => toList(v));
  return String(value)
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toDate(value, fallback) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value;
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value.trim());
    if (!Number.isNaN(d.valueOf())) return d;
  }
  return fallback;
}

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function stripMd(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_m, t, a) => a || t)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*`~$_{}[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstParagraph(body) {
  const blocks = body.split(/\n{2,}/);
  for (const block of blocks) {
    const text = block.trim();
    if (!text) continue;
    if (text.startsWith('#')) continue;
    if (text.startsWith('|')) continue;
    if (text.startsWith('```')) continue;
    if (text.startsWith('$$')) continue;
    if (text.startsWith('>')) continue;
    const clean = stripMd(text);
    if (clean.length > 20) return clean.slice(0, 140);
  }
  return '';
}

function yamlValue(value) {
  return JSON.stringify(value);
}

function main() {
  if (!fs.existsSync(FROM)) {
    console.error(`找不到来源目录：${FROM}`);
    process.exit(1);
  }

  fs.rmSync(TO, { recursive: true, force: true });
  fs.mkdirSync(TO, { recursive: true });
  fs.rmSync(ASSETS, { recursive: true, force: true });
  fs.mkdirSync(ASSETS, { recursive: true });

  const files = walk(FROM);
  const mdFiles = files.filter((f) => /\.md$/i.test(f));
  const imageFiles = files.filter((f) => IMAGE_EXT.test(f));

  const usedIds = new Set();
  const imported = [];
  let skipped = 0;

  for (const file of mdFiles) {
    const relFromRoot = path.relative(FROM, file).replace(/\\/g, '/');
    if (SKIP_PREFIXES.some((prefix) => relFromRoot.startsWith(prefix))) {
      skipped += 1;
      continue;
    }

    const raw = fs.readFileSync(file, 'utf8');
    const { data, body } = splitFrontmatter(raw);
    const stat = fs.statSync(file);

    // 相对 vault 的路径：去掉「笔记/」前缀；根目录文件放进 _root/
    let rel = relFromRoot.replace(/\.md$/i, '');
    if (rel.startsWith('笔记/')) rel = rel.slice(3);
    else if (!rel.includes('/')) rel = `_root/${rel}`;

    // 与 Astro 的 glob id 规则完全一致（Astro 内部用 github-slugger）：
    // 2.1 → 21、空格转连字符、英文小写，中文原样保留
    const slugSegment = (seg) => githubSlug(seg);
    let id = rel.split('/').map(slugSegment).join('/');
    let n = 2;
    while (usedIds.has(id)) {
      id = `${id}-${n++}`;
    }
    usedIds.add(id);

    // 标题：frontmatter.title → 第一个 H1 → 文件名
    const h1 = /^#\s+(.+)$/m.exec(body);
    const title =
      (typeof data.title === 'string' && data.title.trim()) ||
      (h1 ? h1[1].trim() : '') ||
      path.basename(file, '.md');

    // 去掉正文开头的第一个 H1，避免与页面标题重复
    let content = body;
    if (h1) content = body.replace(h1[0], '').replace(/^\s*\n/, '');

    // 分类用原始文件夹名（保留大小写与空格），id 才用小写连字符
    const rawSegments = rel.split('/');
    const category = rawSegments.length > 1 ? rawSegments[0] : '笔记';
    const published = toDate(data.created ?? data.date ?? data.pubDate, stat.mtime);
    const updated = toDate(data.modified ?? data.updated, stat.mtime);
    const tags = [
      ...new Set([
        ...toList(data.tags),
        ...toList(data.tag),
        ...toList(data.categories),
        ...(typeof data.category === 'string' ? [data.category] : []),
      ]),
    ];
    const aliases = toList(data.aliases ?? data.alias);
    const description = firstParagraph(content);

    const lines = ['---', `title: ${yamlValue(title)}`];
    if (description) lines.push(`description: ${yamlValue(description)}`);
    lines.push(`date: ${iso(published)}`);
    if (updated && iso(updated) !== iso(published)) lines.push(`updated: ${iso(updated)}`);
    lines.push(`category: ${yamlValue(category)}`);
    if (tags.length) lines.push(`tags: [${tags.map(yamlValue).join(', ')}]`);
    if (aliases.length) lines.push(`aliases: [${aliases.map(yamlValue).join(', ')}]`);
    const extra = ['chapter', 'section', 'prerequisites'];
    for (const key of extra) {
      if (data[key] != null && data[key] !== '') lines.push(`${key}: ${yamlValue(String(data[key]))}`);
    }
    lines.push(`source: ${yamlValue(relFromRoot)}`);
    lines.push('---', '');

    const outFile = path.join(TO, `${id}.md`);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, lines.join('\n') + content.trimStart(), 'utf8');
    imported.push({ id, title, category, tags: tags.length });
  }

  let copied = 0;
  for (const file of imageFiles) {
    const rel = path.relative(FROM, file).replace(/\\/g, '/');
    const outFile = path.join(ASSETS, rel);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.copyFileSync(file, outFile);
    copied += 1;
  }

  const byCategory = new Map();
  for (const note of imported) byCategory.set(note.category, (byCategory.get(note.category) ?? 0) + 1);

  console.log(`导入 ${imported.length} 篇笔记，跳过 ${skipped} 篇，复制附件 ${copied} 个。`);
  console.log('分组：');
  for (const [name, count] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name}: ${count}`);
  }
  console.log(`输出目录：${path.relative(process.cwd(), TO)}`);
}

main();
