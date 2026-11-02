#!/usr/bin/env node
/**
 * 把一个 Obsidian vault 直接导入成站点文章（和博客文章放在同一个集合里，
 * 列表、归档、标签、图谱、搜索都是同一套）。
 *
 *   npm run import:vault -- --from "D:/obsidian"
 *
 * 做的事：
 *   - 扫描 vault 里的 .md（跳过 .obsidian / .git / .claude / scripts / _lab / assets/reference）
 *   - 生成 posts 能认的 frontmatter：title / pubDate / category / tags / aliases / description
 *   - 正文开头的 H1 去掉（页面标题用 frontmatter 渲染，避免重复）
 *   - 图片等附件复制到 public/vault/
 *   - 输出到 src/content/posts/<分卷>/<笔记>.md，并记录清单，重复导入不会留下旧文件
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
const TO = path.resolve(flag('to', 'src/content/posts'));
const ASSETS = path.resolve(flag('assets', 'public/vault'));
const MANIFEST = path.resolve(flag('manifest', 'scripts/vault-import-manifest.json'));

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

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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

const yamlValue = (value) => JSON.stringify(value);

function previousImport() {
  if (!fs.existsSync(MANIFEST)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    return Array.isArray(data?.ids) ? data.ids : [];
  } catch {
    return [];
  }
}

function removePrevious(ids) {
  let removed = 0;
  for (const id of ids) {
    const file = path.join(TO, `${id}.md`);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      removed += 1;
    }
    // 顺手清掉空目录
    let dir = path.dirname(file);
    while (dir.startsWith(TO) && dir !== TO) {
      try {
        if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
        else break;
      } catch {
        break;
      }
      dir = path.dirname(dir);
    }
  }
  return removed;
}

function main() {
  if (!fs.existsSync(FROM)) {
    console.error(`找不到来源目录：${FROM}`);
    process.exit(1);
  }

  const removed = removePrevious(previousImport());
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

    // Astro 的 glob id 用 github-slugger：2.1 → 21、空格转连字符、英文小写
    const slugSegment = (seg) => githubSlug(seg);
    const rawSegments = rel.split('/');
    const category = rawSegments.length > 1 ? rawSegments[0] : '根目录';
    let id = rawSegments.map(slugSegment).join('/');
    let n = 2;
    while (usedIds.has(id) || fs.existsSync(path.join(TO, `${id}.md`))) {
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
    lines.push(`pubDate: ${iso(published)}`);
    if (updated && iso(updated) !== iso(published)) lines.push(`updatedDate: ${iso(updated)}`);
    lines.push(`category: ${yamlValue(category)}`);
    if (tags.length) lines.push(`tags: [${tags.map(yamlValue).join(', ')}]`);
    if (aliases.length) lines.push(`aliases: [${aliases.map(yamlValue).join(', ')}]`);
    lines.push('---', '');

    const outFile = path.join(TO, `${id}.md`);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, lines.join('\n') + content.trimStart(), 'utf8');
    imported.push({ id, title, category, tags });
  }

  let copied = 0;
  for (const file of imageFiles) {
    const rel = path.relative(FROM, file).replace(/\\/g, '/');
    const outFile = path.join(ASSETS, rel);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.copyFileSync(file, outFile);
    copied += 1;
  }

  // 清单只记来源和 id，不写时间戳：内容没变时重复导入不会产生 diff
  fs.writeFileSync(
    MANIFEST,
    `${JSON.stringify({ from: FROM, ids: imported.map((n) => n.id) }, null, 2)}\n`,
    'utf8',
  );

  const byCategory = new Map();
  for (const note of imported) byCategory.set(note.category, (byCategory.get(note.category) ?? 0) + 1);

  console.log(`导入 ${imported.length} 篇笔记，跳过 ${skipped} 篇，复制附件 ${copied} 个，清掉上次导入 ${removed} 个文件。`);
  console.log('分卷：');
  for (const [name, count] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name}: ${count}`);
  }
  console.log(`输出目录：${path.relative(process.cwd(), TO)}`);
}

main();
