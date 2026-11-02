# Auntilz · 墨痕

> 从 A 到 Z，直到没有一件事被剩下。
> **Auntilz** · *Until No Task Is Left Zero*

一个从零手作的中文博客：宣纸与墨色的古典淡雅，完整的 Markdown 写作体验（LaTeX、Mermaid、代码高亮、脚注、表格、任务清单、MDX），
一套「划词批注」的私人笔记系统，以及**纯展示向的 Obsidian 语法**（双链、callout、知识图谱、反向链接）。

- 作者：[GHeillcoat](https://github.com/GHeillcoat)
- 纯静态输出：没有服务端、没有数据库、没有追踪脚本
- 中文排版优先：首行缩进两字、1.95 行距、两端对齐、着重号、全角标点
- 「好看」与「快」一起做：字体按站点字符集切片、图表与检索按需加载
- 内容就是 `src/content/posts/` 里的 Markdown：可以直接当 Obsidian vault 用；**没有后台/在线编辑器**（见 [写作说明](docs/authoring.md)）

---

## 功能

### 阅读

- **两套纸色**：宣纸（浅）与夜墨（深），跟随系统或手动切换，首帧前定色、不闪白
- **中文排版**：首行缩进、行距 1.95、两端对齐、`<em>` 用着重号而非斜体、块引用用「」与出处
- **目录与进度**：右侧目录 scrollspy 高亮当前小节，页眉一条墨色阅读进度线
- **文章页**：阅读时长与字数、标签、上下篇、脚注、代码复制、图片灯箱（`←` `→` 连播）
- **移动端**：目录与批注收进抽屉，dock 按钮回到顶部

### Obsidian 语法的展示端（不重写客户端）

| 能力 | 说明 |
| --- | --- |
| 双链 | `[[标题]]`、`[[标题\|别名]]`、`[[标题#小节]]`、按文件名/`aliases` 解析；断链显示为虚线 |
| 嵌入 | `![[图片.svg]]` 从 `public/images` 找图并内联 |
| Callout | `> [!note] 标题`、`> [!warning]- 折叠` 等 13 种类型，纸墨色系 |
| 反向链接 / 出链 | 文章底部「关联」自动汇总，点击直达 |
| 知识图谱 | `/graph` 整站图谱 + 首页右侧「书房的地图」可折叠侧栏 + 文章页局部图谱：拖动、缩放、悬停高亮、点击跳转 |
| 多文件跳转 | 双链、反向链接、出链、图谱节点、标签页四路互通 |

### 笔记库（从 Obsidian vault 导入）

- `npm run import:vault -- --from "D:/obsidian"` 把真实 vault 直接导入 `src/content/posts/`，和博客文章同一个集合
- 之后**所有入口都是同一套**：`/posts`（455 篇按时间由近及远）、`/archive`、`/tags`、首页「近作」、`/graph`、全文检索
- 保留原始分卷目录（`笔记/Ch13 RAG/…` → `ch13-rag/…`），生成 `title / pubDate / category / tags / aliases`
- 双链按「完整路径 → 文件名 → 标题 → 别名 → 去空格标点的宽松匹配」容错，`[[#小节]]` 同页跳转也支持
- 附件复制到 `public/vault/`，`![[图片]]` 自动解析
- 支持 `==高亮==`、块引用锚点清理、宽表格横向滚动（Obsidian 常见写法）
- 重复导入按 `scripts/vault-import-manifest.json` 清单清理旧文件，不会残留
- 首页右侧图谱只画链接最多的 80 个枢纽（455 个点会糊成一团），完整图谱在 `/graph`

### 写作（Markdown 全能力）

| 能力 | 说明 |
| --- | --- |
| GFM | 表格（含对齐）、任务清单、删除线、自动链接、脚注 |
| LaTeX | KaTeX 构建期渲染：行内 `$…$`、独立 `$$…$$`、`aligned`、自定义宏 |
| Mermaid | `flowchart` / `sequenceDiagram` / `mindmap` … 客户端渲染，跟随明暗主题 |
| 代码 | Shiki 双主题（墨色），语言标签 + 一键复制 |
| MDX | `src/content/posts/*.mdx` 里可直接写组件与 HTML |
| 元数据 | 兼容 Hexo（`date` / `updated` / `categories`）与 Obsidian properties（`created` / `modified` / `aliases`） |
| 排版件 | 标题锚点、自动 TOC、引用、分隔线、`details` 折叠、`kbd`、图注 |
| 站点件 | RSS（`/rss.xml`）、sitemap、JSON-LD、OG 卡片、404 |

### 批注（做笔记）

- 选中正文任意一句，浮出一枚小工具条：**批注 / 复制 / 引用**
- 批注保存在浏览器 `localStorage`，正文里留下常驻高亮，点击可回看、编辑、删除
- 单篇可导出 Markdown；`/notes` 页按文章汇总，全部导出或清空
- 隐私优先：不上传、不同步，只在这台设备上

### 检索

- `Ctrl`/`Cmd` + `K` 或 `/` 唤出「寻章」命令面板：键盘上下选择、回车打开、`<mark>` 高亮命中
- 生产环境用 [Pagefind](https://pagefind.app) 静态全文索引（构建后生成，零服务端）
- 开发环境用页面内嵌的文章索引兜底，同样可搜

---

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Astro 7（静态生成、内容集合、岛屿式脚本） |
| Markdown | `@astrojs/markdown-remark`（unified）：remark-gfm / remark-math / rehype-katex / rehype-slug |
| 高亮 | Shiki，自定义 `ink-paper` / `ink-night` 双主题 |
| 图表 | Mermaid 12（按需 `import()`） |
| 检索 | Pagefind 1 |
| 字体 | 自托管：Noto Serif SC / EB Garamond / JetBrains Mono 的字符子集（见下） |
| 样式 | 原生 CSS + 设计变量（无 UI 框架） |
| 脚本 | 原生 TypeScript，单个 bundle，约数十 KB |

---

## 部署到 GitHub Pages

- 仓库名用 **`GHeillcoat.github.io`**（用户站点，挂在根路径 `/`），推到 `master` 或 `main`
- 仓库 **Settings → Pages → Source** 选 **GitHub Actions**
- workflow 在 `.github/workflows/deploy.yml`：`npm ci` → `npm run build`（字体子集 + Astro + Pagefind）→ 发布 `dist/`
- 线上地址：`https://gheillcoat.github.io/`
- 换成项目仓库（`/<repo>/` 子路径）或自定义域名的方式，见 [部署说明](docs/deploy.md)
## 快速开始

```bash
npm install

npm run fonts     # 生成字体子集（需要联网；离线时保留旧文件）
npm run dev       # http://localhost:4321
npm run new -- "标题" 文件名   # 新建一篇草稿（frontmatter 已填好）

npm run build     # fonts → astro build → pagefind 索引，产物在 dist/
npm run preview   # 本地预览生产构建
npm run qa        # 端到端自检：用本机 Edge/Chrome 真点一遍交互
```

部署：`dist/` 是纯静态目录，丢到 Cloudflare Pages、Vercel、Netlify、GitHub Pages 或任意 nginx 即可。

> 每次改完文章内容，建议跑一次 `npm run fonts`（`npm run build` 会自动跑），
> 让字体子集覆盖新出现的字。没有联网时会自动沿用现有字体，不会构建失败。

> 写作细节（Obsidian / Hexo frontmatter、双链、callout、图谱）见 **[docs/authoring.md](docs/authoring.md)**。

---

## 目录结构

```
.
├── astro.config.mjs          # 管线配置：remark/rehype（双链 / callout / KaTeX / Mermaid）、Shiki 双主题
├── scripts/
│   ├── fetch-fonts.mjs       # 按站点字符集生成 woff2 子集 + fonts.css
│   ├── import-vault.mjs      # npm run import:vault：把 Obsidian vault 导入成 /vault
│   ├── new-post.mjs          # npm run new：生成一篇草稿
│   ├── shot.mjs              # 截图（本机 Edge headless）
│   └── qa.mjs                # 端到端交互自检
├── src/
│   ├── config.ts             # 站点标题、导航、页脚
│   ├── content.config.ts     # 元数据归一（Obsidian properties / Hexo frontmatter）+ vault 集合
│   ├── content/posts/        # 文章（.md / .mdx）——可以直接当 Obsidian vault
│   ├── layouts/              # BaseLayout / PostLayout
│   ├── components/           # 页眉页脚、卡片、目录、批注面板、图谱、搜索面板…
│   ├── pages/                # 首页/文章/笔记库/图谱/归档/标签/批注/关于/404/rss
│   ├── scripts/              # 主题、命令面板、批注、目录、Mermaid、图谱、灯箱…
│   ├── styles/               # tokens / base / layout / components / prose / ornaments / pages
│   └── lib/                  # vault 索引、双链/callout/Obsidian 额外语法插件、图谱数据、排版工具
├── public/
│   ├── fonts/                # 生成的字体子集（由脚本维护）
│   ├── vault/                # 导入笔记的附件
│   └── images/               # 水墨 SVG 插图与 OG 图
└── docs/                     # 写作说明、设计说明、DOM/图谱契约
```

---

## 新增 / 更新笔记

站点有两种内容来源，可以混用；列表、归档、标签、搜索、图谱会按时间合成一套。

### 方式 A：在 Obsidian 库里写（批量笔记，推荐）

位置就是你的 vault：`D:\obsidian`。笔记放在 `笔记/<分卷>/<文件名>.md`，例如
`笔记/Ch13 RAG/13.3 分块策略.md`。写完/改完，一条命令同步上线：

```bash
npm run sync        # = 重新导入 + 提交 + 推送，1–2 分钟后线上生效
npm run sync -- --from "D:/别的库"   # 换个库路径
```

- 按 `scripts/vault-import-manifest.json` 先清掉上一次导入的副本再生成：**新增会加进来，删除/改名会同步消失**
- 只提交 `src/content/posts/`、`public/vault/`、清单这三个路径，不碰你手写的文章
- 内容没变化时会提示「没有变化，跳过提交与推送」

同步时的映射规则：

| vault 里 | 站点里 |
| --- | --- |
| `笔记/Ch13 RAG/13.3 分块策略.md` | `src/content/posts/ch13-rag/133-分块策略.md` |
| 一级文件夹 `Ch13 RAG` | 分类（列表里的 `Ch13 RAG`） |
| 正文第一个 `# 标题` | 页面标题（写进 frontmatter `title`），并从正文移除 |
| `created` / 文件时间 | 发布日期 `pubDate` |
| `tags` / `aliases` | 标签、`[[别名]]` 解析 |

文件名会成为 URL：小写、空格转 `-`、`2.1` → `21`，中文保留。**改名 = 改 URL**，旧链接会失效。

### 方式 B：直接在项目里写（单篇博客，推荐）

位置：`src/content/posts/`，可手写，也可以用脚手架生成骨架：

```bash
npm run new -- "标题" my-post            # 生成 src/content/posts/my-post.md（draft: true）
npm run new -- "标题" my-post --tags 排版,阅读 --category 札记
```

> ⚠️ 不要直接改 `src/content/posts/ch*/` 下**导入来的**文件：下次 `npm run sync` 会用 vault 原件覆盖它。要改就改 `D:\obsidian` 里的原件。

### 格式

frontmatter 里除了 `title` 都可省；Hexo / Obsidian / 本站三种写法都认：

| 字段 | 说明 |
| --- | --- |
| `title` | 可省：没写就取正文第一个 `# H1`，再没有就用文件名 |
| `pubDate` / `date` / `created` | 发布日期，任选其一；都没写就用文件时间 |
| `updatedDate` / `updated` / `modified` | 可选，更新时间 |
| `description` | 摘要，出现在列表、搜索与分享卡片 |
| `category` / `categories` | 分类 |
| `tags` / `tag` | 标签，字符串或数组都行 |
| `aliases` | 别名，`[[别名]]` 也能链到这里 |
| `draft: true` | 草稿：不构建、不进列表、不进搜索 |
| `featured: true` | 首页「精选」（最多取前 2 篇） |
| `cover` | 可选题图，如 `/images/posts/xxx.svg` |

正文是完整 Markdown：标题、表格、任务清单、脚注、代码块、`$行内公式$` 与 `$$独立公式$$`、
```` ```mermaid ```` 图、Obsidian 双链 `[[标题]]` / `![[图片]]`、callout `> [!note]`、`==高亮==`。

```md
---
title: 一篇新笔记
description: 一句话说明这篇写什么
pubDate: 2026-11-02
category: 札记
tags: [笔记, 方法]
---

正文段落。

## 小节

行内公式 $T = N/320$，双链 [[另一篇笔记]]，高亮 ==重要==。
```

### 更新与上线

```bash
npm run dev      # 本地预览 http://localhost:4321（改完即时刷新）
npm run sync     # 方式 A：从 Obsidian 同步 → 提交 → 推送
# 方式 B：
git add -A && git commit -m "post: 标题" && git push
```

推送后 GitHub Actions 自动构建并部署，约 1–2 分钟线上生效；构建里会重跑字体子集与
Pagefind 索引，新出现的字不用手动处理（想本地生成就 `npm run fonts`）。

**发布后会出现在**：`/posts`（按时间倒序）、`/archive`、`/tags`、`/graph`、`Ctrl+K` 全文检索；
`draft: true` 的不会出现。

---

## 设计说明

- **纸与墨**：浅色纸 `#f6f2e8`、深色「夜墨」`#14130f`；墨色分四档（正文/次要/说明/极淡），朱砂 `#9c4033` 只用于印章与强调（面积 < 1%）
- **字**：正文 19px / 行距 1.95，标题用 500 字重而非加粗，装饰小字用系统楷体
- **留白**：版心 44rem，页边随视口收缩；分节用云纹细线与菱形分隔
- **动效**：只做透明度、位移与下划线展开；`prefers-reduced-motion` 时全部关闭
- 更细的设计记录见 [`docs/design-notes.md`](docs/design-notes.md)，交互契约见 [`docs/dom-contract.md`](docs/dom-contract.md)，内容规范见 [`docs/content-brief.md`](docs/content-brief.md)

## 性能取舍

实测（本地 `npm run build` + `astro preview`，单页首次访问、未压缩传输）：

| 页面 | HTML | CSS | JS | 字体 | 合计 |
| --- | --- | --- | --- | --- | --- |
| 首页 | 23 KB | 82 KB | 40 KB | 607 KB | **约 0.75 MB** |
| 文章页（含公式/代码） | 32 KB | 111 KB | 40 KB | 607 KB | **约 0.8 MB** |
| 含 Mermaid 图 | 32 KB | 111 KB | 滚动到图附近才加载 | 607 KB | 图表 JS 另计 |

- CSS 压缩后约 **26 KB**（gzip），脚本入口约 **12 KB**（gzip）；字体是 woff2（已压缩），命中的分组缓存一年
- **字体**：中文 webfont 是这类站点的最大开销。这里不用 Google 默认的 100+ unicode 分片（实测单个中文页要下 ~2 MB），而是扫描全站字符集，向 Google Fonts 请求「只含这些字」的可变字重子集（每 600 字一组，附带精确 `unicode-range`）。全站字体约 **0.6 MB**，变量字重一份覆盖 400–700。
- **图表与检索**：Mermaid（约 0.4 MB gzip）、Pagefind（索引 0.6 MB）都只在真正用到时动态加载；不读图、不搜字就没有这部分开销。
- **不过度预取**：链接预取用 `hover` 策略，而不是把所有视口内链接都提前下载。
- **无第三方运行时**：没有 UI 框架、没有 jQuery、没有分析脚本。

## 改成你自己的

1. `src/config.ts`：站点名、标语、作者、导航、页脚
2. `astro.config.mjs`：`site` 改成你的域名（影响 RSS / sitemap / canonical / OG）
3. `src/pages/about.astro`：邮箱与个人介绍
4. `public/favicon.svg`、`public/images/art/og.svg`：印章与分享卡片
5. 写作后跑一次 `npm run fonts`（或直接 `npm run build`），让字体子集覆盖新出现的字

## 文档

- [写作说明](docs/authoring.md)：Obsidian vault / Hexo frontmatter、双链、callout、图谱与发布流程
- [设计说明](docs/design-notes.md)：纸墨系统、版心、夜墨、动效与体积取舍
- [交互说明](docs/interaction-notes.md)：`src/scripts/` 的模块划分与约定
- [DOM 契约](docs/dom-contract.md)：所有 `data-*` 钩子与行为
- [图谱契约](docs/graph-contract.md)：Canvas 图谱引擎的 DOM / 数据 / 交互要求
- [内容规范](docs/content-brief.md)：文章与插图的规范（给内容协作者看）

## 已知取舍

- 字体子集需要联网生成；离线构建时沿用旧字体（可能缺新字，回退到系统宋体）
- 重新生成字体后需要**重启 `npm run dev`** 才会用上新哈希（dev 的 SSR 会内联旧的 `@font-face`）
- Pagefind 索引只在 `npm run build` 后存在；`npm run dev` 下搜索走内置索引（标题/摘要级）
- 批注只存在本机浏览器，清缓存会丢，重要笔记请导出 Markdown
- Mermaid 首次进入视口时才加载（约 100 KB gzip 起，随图表类型增加），移动端图表会整体等比缩小以适配宽度
- 批注锚点用「原文 + 前后文」定位，文章大改（尤其是被批注的那段）后旧高亮可能找不到位置
- 修改 `astro.config.mjs` 里的 remark/rehype 插件后，Astro 会复用内容缓存：需要 `rm -rf .astro` 再构建（文章内容改动不需要）

## 致敬

排版取自中文印刷的旧规矩（首行缩进、标点占位、着重号），色彩取自宣纸与墨；
代码与设计都是在这个仓库里从零长出来的。

## License

内容与插图版权归作者所有；代码部分可自由取用。


