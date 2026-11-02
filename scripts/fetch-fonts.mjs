/**
 * 自托管字体：把站点实际用到的字符，按 600 字一组，向 Google Fonts 请求
 * 「只含这些字」的可变字重 woff2 子集，并为每组写入精确的 unicode-range。
 *
 * 为什么这样做：
 *   Google 默认按 100+ 个 unicode 分片提供思源宋体，一个中文页面往往要下载
 *   30+ 个分片、约 2MB。按站点字符集切片后，全站字体总量约 1MB，
 *   单个页面通常只命中 3–4 个分组，而且 woff2 变量字体一份覆盖 400–700 全部字重。
 *
 *   node scripts/fetch-fonts.mjs        # 有网时执行；失败会保留旧文件并退出 0
 *
 * 输出：public/fonts/*.woff2 + src/styles/fonts.css
 */
import { mkdir, readdir, readFile, writeFile, stat, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const OUT_DIR = path.resolve('public/fonts');
const CSS_OUT = path.resolve('src/styles/fonts.css');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const CHUNK_SIZE = 600;

const FAMILIES = [
  {
    family: 'Noto Serif SC',
    query: 'Noto+Serif+SC:wght@400..700',
    slug: 'noto-serif-sc',
    filter: () => true,
  },
  {
    family: 'EB Garamond',
    query: 'EB+Garamond:ital,wght@0,400..700;1,400..700',
    slug: 'eb-garamond',
    filter: (char) => char.codePointAt(0) < 0x2e80,
  },
  {
    family: 'JetBrains Mono',
    query: 'JetBrains+Mono:wght@400..700',
    slug: 'jetbrains-mono',
    filter: (char) => char.codePointAt(0) < 0x2e80,
  },
];

/** 界面里可能出现的符号，即使源码里暂时没有也要覆盖 */
const BASE_CHARS = [
  ...' !"#$%&\'()*+,-./0123456789:;<=>?@',
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`',
  ...'abcdefghijklmnopqrstuvwxyz{|}~',
  ...'，。、；：？！…—～·「」『』（）〔〕【】《》〈〉“”‘’￥№℃№§¶†‡•‰′″',
  ...'←↑→↓⇧⌘⌥↵⌫⇥⌃␣⎋',
  ...'《》〈〉「」『』〖〗',
  ...'—…· ‧ ×÷ ± ≤ ≥ ≠ ∞ ∵ ∴ ∈ ∉ ∪ ∩ ∑ ∏ √ ∫ ≈ ≡ ≪ ≫ ⊂ ⊃ ⊥ ∠ °',
  ...'äöüßéèêëáàâíìîóòôúùûñçøåæœ',
  ...'ÄÖÜÉÈÊËÁÀÂÍÌÎÓÒÔÚÙÛÑÇØÅÆŒ',
];

const TEXT_EXT = /\.(md|mdx|astro|ts|mts|js|mjs|json|txt|yml|yaml|html)$/;

async function collectFiles(dir, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (['node_modules', 'dist', '.git', '.shots', '.tmp', '.astro'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectFiles(full, acc);
    else if (TEXT_EXT.test(entry.name)) acc.push(full);
  }
  return acc;
}

async function collectCharset() {
  const files = [...(await collectFiles('src')), ...(await collectFiles('public')), ...(await collectFiles('docs'))];
  const chars = new Set(BASE_CHARS);
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    for (const char of text) {
      if (char === '\n' || char === '\r' || char === '\t') continue;
      chars.add(char);
    }
  }
  // 保留可见字符与常用空白符号，去掉控制字符/私用区
  const list = [...chars].filter((char) => {
    const cp = char.codePointAt(0);
    if (cp < 0x20) return false;
    if (cp >= 0xe000 && cp <= 0xf8ff) return false;
    return true;
  });
  return list.sort();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

function parseFaces(css) {
  const faces = [];
  for (const block of css.match(/@font-face\s*\{[^}]*\}/g) || []) {
    const get = (prop) => {
      const m = block.match(new RegExp(`(?:^|\\n|;)\\s*${prop}:\\s*([^;]+);`));
      return m ? m[1].trim() : '';
    };
    const family = (get('font-family') || '').replace(/^['"]|['"]$/g, '');
    const style = get('font-style') || 'normal';
    const weight = get('font-weight') || '400';
    const range = get('unicode-range');
    const srcMatch = block.match(/url\((https:[^)]+)\)/);
    if (!family || !srcMatch) continue;
    faces.push({ family, style, weight, range, url: srcMatch[1] });
  }
  return faces;
}

const usedFiles = new Set();

async function download(url, slug) {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 10);
  const name = `${slug}-${hash}.woff2`;
  const target = path.join(OUT_DIR, name);
  try {
    await stat(target);
  } catch {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${res.status} for ${url}`);
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
  }
  usedFiles.add(name);
  return `/fonts/${name}`;
}

/** 把字符集切成若干组（每组 ≤ CHUNK_SIZE） */
function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const started = Date.now();

  const chars = await collectCharset();
  const groups = chunk(chars, CHUNK_SIZE);
  console.log(`字符集：${chars.length} 个字符，分 ${groups.length} 组`);

  const rules = [];
  let bytes = 0;
  let failures = 0;
  let totalFaces = 0;

  for (const fam of FAMILIES) {
    const famChars = chars.filter((char) => fam.filter(char));
    const famGroups = chunk(famChars, CHUNK_SIZE);
    for (const [index, group] of famGroups.entries()) {
      const text = group.join('');
      if (!text) continue;
      const cssUrl = `https://fonts.googleapis.com/css2?family=${fam.query}&text=${encodeURIComponent(
        text,
      )}&display=swap`;
      let css;
      try {
        css = await fetchText(cssUrl);
      } catch (err) {
        console.warn(`  ! ${fam.family} group ${index}: ${err.message}`);
        failures += 1;
        continue;
      }
      const faces = parseFaces(css);
      if (!faces.length) {
        console.warn(`  ! ${fam.family} group ${index}: 没有解析到 @font-face`);
        failures += 1;
        continue;
      }
      for (const face of faces) {
        let local;
        try {
          local = await download(face.url, fam.slug);
        } catch (err) {
          console.warn(`  ! download ${face.url}: ${err.message}`);
          failures += 1;
          continue;
        }
        bytes += (await stat(path.resolve(`public${local}`))).size;
        rules.push(
          `@font-face{font-family:'${face.family}';font-style:${face.style};font-weight:${face.weight};` +
            `font-display:swap;src:url(${local}) format('woff2');` +
            (face.range ? `unicode-range:${face.range};` : '') +
            `}`,
        );
      }
      console.log(`  ${fam.slug} group ${String(index + 1).padStart(2, '0')}/${famGroups.length}: ${faces.length} 个 face`);
    }
  }

  if (!rules.length) {
    console.warn('没有获取到任何字体，保留现有 fonts.css');
    return;
  }

  const header =
    '/* AUTO-GENERATED by scripts/fetch-fonts.mjs — 请勿手改。 */\n' +
    `/* ${chars.length} 字符 / ${groups.length} 组 / ${rules.length} 条 @font-face */\n`;
  await writeFile(CSS_OUT, header + rules.join('\n') + '\n', 'utf8');

  // 清掉不再被引用的旧字体文件（有失败时保守起见不清，避免删掉仍在用的文件）
  let removed = 0;
  if (failures === 0) {
    for (const file of await readdir(OUT_DIR)) {
      if (!usedFiles.has(file)) {
        await unlink(path.join(OUT_DIR, file)).catch(() => {});
        removed += 1;
      }
    }
  }

  console.log(
    `完成：${rules.length} 条规则，${(bytes / 1048576).toFixed(2)} MB，清理旧文件 ${removed} 个，用时 ${(
      (Date.now() - started) / 1000
    ).toFixed(1)}s${failures ? `，${failures} 组失败` : ''}`,
  );
}

main().catch((err) => {
  // 离线构建时不要阻断：保留旧字体，只提示
  console.warn(`字体生成失败（将使用现有字体文件）：${err.message}`);
  process.exit(0);
});

