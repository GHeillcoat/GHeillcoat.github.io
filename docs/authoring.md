# 写作说明（Obsidian / Hexo 兼容）

这是一个**纯静态博客**：没有后台、没有数据库、没有在线编辑器。
内容就是 `src/content/posts/` 下的 Markdown 文件——这也意味着你可以直接把这个目录
当 **Obsidian vault** 打开：双链、callout、图片嵌入都能正常渲染成网页。

> 它不是 Obsidian 客户端：没有编辑器、没有文件树、没有插件系统。
> 写作在 Obsidian（或任何编辑器）里完成，展示交给这个站点。

## 一、日常流程

```bash
npm run new -- "标题" 文件名            # 生成一篇草稿（frontmatter 已填好）
# …在 Obsidian / VS Code 里写…
npm run dev                             # 本地预览 http://localhost:4321
npm run fonts                           # 文章里出现了新字，重新生成字体子集
npm run build                           # 输出 dist/，丢到任意静态托管即可
```

把这个目录（或 `src/content/posts`）在 Obsidian 里「打开文件夹作为库」即可，
`.obsidian/` 配置不会进构建产物（已在 `.gitignore` 外，但属于本地配置，建议自行忽略）。

## 一·五、把一整个 Obsidian vault 导进来

如果有一份真实的笔记库（比如 `D:/obsidian`），不必手动搬文件：

```bash
npm run import:vault -- --from "D:/obsidian"    # 导入到 src/content/vault/
npm run fonts                                   # 新字补进字体子集
npm run build
```

它会：

- 跳过 `.obsidian`、`.git`、`.claude`、`scripts`、`assets/reference`
- 保留分卷目录（`笔记/Ch13 RAG/…` → `/vault/ch13-rag/…`），id 与 Astro 的 slug 规则一致
- 按 `created` / 文件时间生成日期，从第一个 H1 取标题并把它从正文里去掉
- 保留 `tags`、`aliases`、`chapter`、`section`、`prerequisites`，生成 `category`
- 复制图片附件到 `public/vault/`，`![[图片]]` 直接可用
- 双链按「完整路径 → 文件名 → 标题 → 别名 → 去空格标点的宽松匹配」解析，`[[#小节]]` 也能跳

导入的笔记有自己的 `/vault` 索引页与详情页，**不进入**首页、归档、标签页和 `/graph`，
所以不会把博客淹掉；双链仍与博客文章互通。重新导入会覆盖 `src/content/vault/`（源库不动）。

## 二、Frontmatter：三种写法都认

站点内部统一成「发布日期 / 更新日期 / 标签 / 分类」，所以下面任意一种都能用：

```yaml
# 本站风格
title: 空的地方，才是园林
pubDate: 2024-06-18
updatedDate: 2024-07-02
category: 札记
tags: [留白, 造园]
```

```yaml
# Hexo 风格
title: 空的地方，才是园林
date: 2024-06-18
updated: 2024-07-02
categories: 札记
tags: [留白, 造园]
```

```yaml
# Obsidian properties 风格
title: 空的地方，才是园林
created: 2024-06-18
modified: 2024-07-02
aliases: [留白, 空的园林]
tag: 札记
```

| 站点字段 | 可用写法 |
| --- | --- |
| 发布日期 | `pubDate` / `date` / `created` / `created_at` |
| 更新日期 | `updatedDate` / `updated` / `modified` / `lastmod` |
| 标签 | `tags` / `tag`（字符串或数组，逗号、顿号都能分隔） |
| 分类 | `category` / `categories`（取第一个） |
| 别名 | `aliases` / `alias` —— 用于 `[[别名]]` 双链 |
| 草稿 | `draft: true` 或 `publish: false` |
| 摘要 | `description`；没有就用正文前 120 字（支持 Hexo 的 `<!-- more -->` 截断） |

## 三、展示能力

### 1. 双链（Obsidian wiki link）

```md
[[空的地方，才是园林]]                 → 按标题链接
[[the-art-of-leaving-blank]]           → 按文件名链接
[[空的地方，才是园林|那篇讲留白的]]      → 自定义显示文字
[[静态站点为什么快#四、字体切片]]        → 链接到某篇的小节（写完整的小节标题）
[[留白]]                               → 用 frontmatter 里的 aliases
![[blank-window.svg]]                  → 嵌入 public/images 下的图片
```

> 小节锚点按标题文字生成（标点会被去掉），所以要写**完整的小节标题**：
> `## 四、字体切片` 的 id 是 `四字体切片`，写 `[[标题#四、字体切片]]` 就能正确跳转。

- 解析不到的链接会渲染成**断链样式**（虚线 + 淡朱砂），构建不会失败；
- 每篇文章底部会自动出现「关联」：反向链接、出链、局部图谱；
- 双链还会喂给 `/graph` 页面的整站图谱。

### 2. Callout

```md
> [!note] 小标题
> 正文，可以有多段、列表、代码。

> [!warning]- 默认折叠
> 用 `-` 折叠、`+` 默认展开；不加符号就是普通展开。
```

支持：`note` `abstract` `info` `todo` `tip` `success` `question` `warning`
`failure` `danger` `bug` `example` `quote`（以及 `summary` `caution` `error` 等别名）。

### 3. 知识图谱

- `/graph`：整站图谱，拖动平移、滚轮缩放、点节点进文章；右侧列出全部笔记与链接数。
- 文章页「关联」：当前文章 + 一跳邻居的局部图谱，以及反向链接 / 出链列表。

### 4. 其他

- 数学 `$…$` / `$$…$$`（KaTeX，构建期渲染）
- Mermaid（` ```mermaid `，滚动到附近才渲染）
- 代码高亮 + 复制、脚注、任务清单、表格、`details`、图片灯箱
- 划词批注（存在浏览器本地，可导出 Markdown）

## 四、常见问题

**为什么没有「后台/上传」？**
因为它是静态站：构建一次，`dist/` 就是整个博客。没有服务端要维护，也就不用登录、数据库和备份。
内容在 Git 里，就是最好的版本管理。

**想在线写怎么办？**
两条路：① 继续用 Obsidian 写本地库，用 Git 推送后触发托管平台构建；
② 以后可以加一个纯静态的「本地编辑器」页面（导出 Markdown 再提交），但那是另一个产品形态了。

**新增文章后为什么要跑 `npm run fonts`？**
字体是按站点字符集做的子集；新文章可能出现新字。`npm run build` 会自动跑一次。
