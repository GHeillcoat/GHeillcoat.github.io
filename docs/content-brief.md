# 内容与插图说明（内容工程师看这里）

你的工作区：`src/content/posts/**`（Markdown 文章）与 `public/images/posts/**`（自制插图）。
**不要改** `src/` 下的其它文件（模板、样式、脚本都是别人的边界）。

站点是国内访问的静态博客，读者是中文技术/阅读人群。文章要像一本装帧讲究的随笔集里的文章，
而不是公众号爆款：有信息量、有个人判断、句子短、少形容词。

## 一、Frontmatter 规范（严格按此，字段缺失会导致构建失败）

```yaml
---
title: 标题（会显示在列表与文章头，12–22 字最好）
subtitle: 可选，一句副题（楷体显示）
description: 60–110 字，用于列表摘要、SEO、卡片
pubDate: 2025-09-18          # 注意：不加引号，YYYY-MM-DD
updatedDate: 2025-10-02      # 可选
category: 札记 | 技术 | 随笔 | 排版 | 译文   # 单选，会出现在文章头上
tags: [中文标签, 2–4 个]
featured: false              # 最多 2 篇为 true（首页精选卡片）
cover: /images/posts/xxx.svg # 可选，题图（featured 文章建议都配）
draft: false
lang: zh                     # 默认 zh
---
```

现有示例：`src/content/posts/from-a-sheet-of-xuan-paper.md`（**保留它，可参考写法，不要删除/重写**）。

## 二、文章清单（共 5 篇新文章，覆盖不同功能）

时间跨度 2024-06 ~ 2025-09，彼此不要同日。建议（可微调标题，不要跑题太远）：

| 文件 | 主题方向 | 必须包含的 Markdown 能力 |
| --- | --- | --- |
| `the-art-of-leaving-blank.md` | 从《园冶》《长物志》谈「留白」，落到界面设计里的呼吸感 | 引用块（引古文）、`em` 着重、表格、脚注、`hr` |
| `why-static-is-fast.md` | 静态站点为什么快：构建期渲染、字体切片、按需索引 | 代码块 `ts`+`bash`、行内代码、有序列表、表格、`details` 折叠 |
| `a-reading-time-model.md` | 用一点数学估计阅读时长：中英混排的字词折算 | 行内公式 `$...$`、独立公式 `$$...$$`（含 `aligned`）、表格、脚注 |
| `notes-on-chinese-typesetting.md` | 中文排版细节：标点占位、首行缩进、行距与字号的关系 | 引用块、`kbd` 行内 HTML、图片（figure+figcaption）、`hr`、任务清单 |
| `rain-and-old-bookshops.md` | 一篇文学性随笔：雨天的旧书店、纸张的气味 | 图片（figure）、引用、`em`、脚注、尽量少列表 |

再加一篇 Mermaid 专题（**必须有 2 个以上图表，其中一个用 `sequenceDiagram` 或 `mindmap`**）：

| 文件 | 主题方向 | 必须包含 |
| --- | --- | --- |
| `how-a-post-gets-built.md` | 一篇文章从 Markdown 到网页的旅程 | ```` ```mermaid ```` flowchart + sequenceDiagram、代码块、表格、脚注 |

合计 6 篇。首页「精选」按 `featured: true` 取前两篇，请确保其中至少一篇配了 `cover`。

## 三、写作要求

- 每篇 900–2200 字（中文字数），结构：开头一段切入 → 3–4 个 `##` 小节（可带 `###`）→ 收尾一段。
- 中文标点：全角标点 `，。：；「」『』（）——……`；不要用英文逗号代替；数字与英文前后不必加空格（排版已处理）。
- 不要 emoji；不要「家人们」「绝绝子」这类网络腔；不要空洞排比。
- 引文要准确：能确定出处的才引（《园冶》《长物志》《闲情偶寄》《人间词话》《说文解字》等），
  不确定就用「大意是」或干脆不引。宁可少引，不要编造。
- 技术类文章要有具体细节（版本号、命令、时间数字），但不要写会过期的营销话术。
- 数学必须自洽（`a-reading-time-model` 的公式推导要能对上，给出例子）。
- Mermaid 图语法要正确（`flowchart LR`、`sequenceDiagram`、`mindmap`，节点文字用中文，不要用特殊符号）。
  图里不要用 `style` 之外的花哨配置，颜色交给主题，最多给 1–2 个节点 `style` 强调。
- 图片用 HTML figure 才能有图注：

  ```html
  <figure>
    <img src="/images/posts/xxx.svg" alt="描述" loading="lazy" />
    <figcaption>图注：一句话说明</figcaption>
  </figure>
  ```

- 代码块标注语言（`ts` `bash` `python` `json`），单行不超过 88 字符（移动端可读）。
- 脚注：正文里写 `[^1]`，文末连续写 `[^1]: 内容`（多个脚注之间不要空行）。
- 任务清单用 `- [ ]` / `- [x]`。

## 四、插图（SVG 手绘感）

在 `public/images/posts/` 里画 3–4 张插图，另可给文章配封面（16:9，1200×675）。

- 风格：宣纸上的水墨小品——远山、树影、窗格、茶盏、书脊、雨丝。
  用 `<path>` 的柔和轮廓 + 渐变/多段 opacity 做出「墨分五色」，不要几何拼贴、不要剪贴画感。
- 只允许这些颜色（可调透明度）：纸 `#f6f2e8`（或透明背景）、墨 `#24211c`、淡墨 `#4b453b`、
  朱砂 `#9c4033`、赭金 `#a5875a`。深色模式不要求单独出图（图片是浅色纸上的画，可加淡纸底色）。
- 不要在图里放文字（除了极少量印章式字，如一个「記」字）。
- 每张图 ≤ 60KB，`viewBox` 明确，`xmlns` 齐全，能被 `<img>` 直接引用。
- 参考已有的 `/images/art/ink-mountains.svg` 的分层感觉（但不要照抄）。

## 五、自检

1. 写完跑一次 `npx astro build`，确认 6 篇文章都生成、没有 frontmatter 报错；
   如果报错来自别人的 CSS/脚本（不是你的文件），把错误贴给 lead，不要自己改别人的文件。
2. 用 `node scripts/shot.mjs "http://127.0.0.1:4321/posts/<你的文章>" ".shots/<name>.png" --w=1440 --h=900 --full --theme=light`
   抽 2 篇看看渲染（尤其是 Mermaid 占位、公式、图片、脚注是否都在）。
3. 完成后把文章清单（标题/日期/标签/特性）用 `send_message` 报给 lead。
