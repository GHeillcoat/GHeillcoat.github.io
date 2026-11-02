#!/usr/bin/env node
/**
 * 新建一篇笔记（在 src/content/posts 下生成 .md 骨架）。
 *
 *   npm run new -- "标题"                      # 自动生成文件名
 *   npm run new -- "标题" my-note              # 指定文件名（推荐英文/拼音）
 *   npm run new -- "标题" my-note --tags 排版,阅读 --category 札记
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const title = args[0];
if (!title) {
  console.error('用法：npm run new -- "标题" [文件名] [--tags a,b] [--category 札记]');
  process.exit(1);
}

const flag = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const tags = flag('tags', '')
  .split(/[,，、]/)
  .map((tag) => tag.trim())
  .filter(Boolean);
const category = flag('category', '随笔');
const explicitName = args[1] && !args[1].startsWith('--') ? args[1] : '';

const today = new Date();
const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
  today.getDate(),
).padStart(2, '0')}`;

const asciiSlug = title
  .toLowerCase()
  .replace(/[^\w\u4e00-\u9fff]+/g, '-')
  .replace(/^-+|-+$/g, '');
const name = explicitName || (/^[\w-]+$/.test(asciiSlug) && asciiSlug.length > 2 ? asciiSlug : `note-${iso}`);

const file = path.resolve('src/content/posts', `${name}.md`);
if (fs.existsSync(file)) {
  console.error(`已存在：${file}`);
  process.exit(1);
}

const frontmatter = `---
title: ${title}
description: 一句话说明这篇要写什么（会出现在列表、搜索与分享卡片里）
date: ${iso}
categories: ${category}
tags: [${tags.join(', ')}]
draft: true
---
`;

const body = `
## 开头

写一段引入。

> [!note] 小提示
> callout 用 \`> [!note] 标题\` 写，支持 note / tip / warning / danger / info / quote / example 等。

## 正文

双链用 \`[[另一篇的标题]]\`，也可以用 \`[[标题|显示的文字]]\` 或 \`[[标题#小节]]\`；
嵌入图片用 \`![[图片名.svg]]\`。

<!-- more -->

写完把 frontmatter 里的 \`draft: true\` 去掉，然后：

\`\`\`bash
npm run fonts   # 让字体子集覆盖新出现的字
npm run build
\`\`\`
`;

fs.writeFileSync(file, frontmatter + body, 'utf8');
console.log(`已创建：${path.relative(process.cwd(), file)}`);
console.log('提示：这是草稿（draft: true），写完删掉这行即可发布。');
