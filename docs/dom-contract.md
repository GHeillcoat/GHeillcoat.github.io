# DOM 契约（交互工程师看这里）

站点的所有前端交互都从 `src/scripts/app.ts` 一个入口加载（`BaseLayout` 里 `import '../scripts/app'`），
模块内部按 DOM 是否存在决定是否初始化。请不要改动 `.astro` 文件里的 class 与 data 属性，
需要新钩子时找 Lead 加。

全文约束：

- 所有监听用 `addEventListener(..., { passive: true })`（滚动类）；滚动处理用 `requestAnimationFrame` 节流。
- 不引入新的第三方运行时依赖（`mermaid`、`pagefind` 已装，且必须动态 `import()` 按需加载）。
- 不用 `innerHTML` 拼接用户输入（批注文本必须 `textContent`）。
- `prefers-reduced-motion: reduce` 时取消动画。
- 无 JS 时页面必须仍然可读（渐进增强）。
- 用 `src/lib/format.ts` 里已有的时间/字数工具，别重复实现。

## 1. 主题（`data-theme` + localStorage）

- `<html data-theme="light|dark">` 由 `BaseLayout` 的内联脚本在首帧前设置；`?theme=dark` 查询参数可强制。
- 切换按钮：`[data-theme-toggle]`（页眉，两个 SVG `.icon-moon` / `.icon-sun` 用 CSS 控制显隐）。
- 持久化：`localStorage['ink:theme'] = 'light' | 'dark'`。
- 切换后 `document.dispatchEvent(new CustomEvent('ink:themechange', { detail: { theme } }))`。
- 快捷键 `T` 切换（输入框/文本域/contenteditable 聚焦时不触发；带修饰键时不触发）。

## 2. 页眉

- `[data-site-header]`：`scrollY > 8` 时加 `data-scrolled` 属性。
- `[data-menu-toggle]`：切换 `[data-site-nav]` 的 `data-open` 属性，并同步 `aria-expanded`。
  点击导航链接、点击外部、`Esc` 时关闭。
- `[data-progress] span`：`transform: scaleX(ratio)`，ratio = `scrollY / (scrollHeight - innerHeight)`，clamp 0..1。

## 3. 命令面板（搜索）

- 外壳：`[data-palette]`（`hidden` 控制），内部 `[data-palette-input]`、`[data-palette-results]`、
  `[data-palette-engine]`、`[data-palette-group]`（占位分组标签，可重绘）、`[data-palette-close]`（背板）。
- 打开：点击 `[data-palette-open]`、`Ctrl/Cmd + K`、`/`（非输入态）。`Esc` 关闭并把焦点还给触发元素。
- 输入框自动聚焦；打开时清空上次查询。
- 数据源：
  - 生产环境用 Pagefind：`await import('/pagefind/pagefind.js')`（构建后才有；失败则退化）。
    API：`const pagefind = await import('/pagefind/pagefind.js'); await pagefind.options({}); const res = await pagefind.search(q);`
    每条 `res.results.map(r => r.data())` 得到 `{ url, excerpt, meta: { title, ... } }`。
  - 退化/开发环境：静态快捷项（首页、文章、归档、标签、批注、关于、明暗切换、RSS），
    外加页面里的 `<script type="application/json" data-post-index>`，
    内容是 `[{ t: 标题, u: url, d: 描述, c: 分类, y: 日期 }]`（全站每页都有）。
- 结果项：`role="option"`，`[data-palette-item]`，`aria-selected`；键盘 ↑ ↓ 选择，↵ 打开，鼠标悬停同步选中。
- 命中文字用 `<mark>` 包住（从 Pagefind excerpt 的 `<mark>` 片段安全处理：只保留文本 + mark）。
- 空结果：`<p class="palette-empty">没有找到「xxx」</p>`；引擎标签写 `Pagefind` 或 `站内页面`。
- 打开时给 body 加 `data-palette-open`（用于锁滚动/压暗，可选）。

## 4. 目录（Scrollspy）

- 容器 `[data-toc]`，链接列表 `[data-toc-list]`，条目 `li` 通常带 `.toc-depth-2/3`。
- 观察 `[data-prose]` 内的 `h2[id]`、`h3[id]`，滚动时把最靠近视口顶部（阈值 ~120px）的标题
  对应 `li` 加 `.is-active`（同时移除其它）。
- 点击目录链接：关闭移动端抽屉（若打开）。

## 5. 批注（核心功能）

### 存储

`localStorage['ink:notes:v1']` = `Note[]`

```ts
type Note = {
  id: string;          // 短哈希，见 shortHash()
  slug: string;        // 文章 id
  title: string;       // 文章标题（冗余保存，便于批注页展示）
  url: string;         // 文章 url
  text: string;        // 被选中的原文
  note: string;        // 用户写的批注
  prefix: string;      // 原文前 24 个字符，用于定位
  suffix: string;      // 原文后 24 个字符
  createdAt: number;
  updatedAt: number;
};
```

文章上下文：`article[data-post]` 上有 `data-slug`、`data-title`、`data-url`、`data-date`。
正文容器：`[data-prose]`。

### 划词工具条

- `[data-selection-toolbar]` 默认 `hidden`；在 `[data-prose]` 内选中 ≥2 个字符时显示，
  定位在选区上方居中（容错边界），并在滚动/点击别处/选区折叠时隐藏。
- 三个动作按钮：`[data-sel-action="note"|"copy"|"quote"]`。
  - `note`：打开批注编辑器（见下）。
  - `copy`：复制选中文本，toast「已复制」。
  - `quote`：复制 Markdown 引用：
    ```
    > 选中文字
    >
    > —— 《文章标题》 文章URL
    ```

### 批注编辑器

- `[data-note-editor]` 默认 `hidden`；`[data-note-editor-quote]` 显示选中原文；
  `[data-note-editor-input]` 是 textarea；`[data-note-editor-save]` / `[data-note-editor-cancel]` /
  `[data-note-editor-delete]`（编辑已有批注时才显示）。
- 保存后：写入 localStorage、重新渲染高亮、刷新面板、toast「已记下」。
- 编辑已有批注（点击正文高亮或面板里的条目）时预填内容；删除需二次确认（可用 `confirm()`）。
- `Esc` 关闭编辑器。

### 高亮

- 载入时把本文所有 note 的 `text` 在 `[data-prose]` 中找到（优先 `prefix+text+suffix` 匹配，
  退化到 `text` 首次出现），用 `<mark class="hl" data-note-id="id" data-has-note>` 包裹。
- 跳过 `pre`、`code`、`a`、`mark`、`mermaid-block`、`script`、`style` 内部；跳过已包裹的文本。
- 点击高亮：打开编辑器（同文档批次可编辑/删除）；同时给面板对应条目 `data-active`。
- 注意：批注 id 相同的高亮只包一次；重渲染前先撤销旧的高亮（`mark.hl` → `textContent`）。

### 批注面板（文章页右侧，移动端在抽屉里）

- `[data-notes-panel]`、`[data-notes-list]`、`[data-notes-count]`、`[data-notes-count-inline]`、
  `[data-notes-badge]`（dock 上的数字气泡）、`[data-notes-empty]`、`[data-notes-export]`。
- 条目结构（建议）：

  ```html
  <li class="note-item" data-note-id>
    <p class="note-quote">被选中的原文</p>
    <p class="note-body">批注内容</p>
    <div class="note-foot">
      <span>2025.10.12 14:20</span>
      <div class="note-links">
        <button data-note-jump>定位</button>
        <button data-note-edit>编辑</button>
        <button data-note-delete>删除</button>
      </div>
    </div>
  </li>
  ```

- 计数为 0 时显示 `[data-notes-empty]` 并隐藏列表（用 `hidden`）。
- 导出（当前文章）：Markdown 文件，文件名 `批注-{title}.md`，内容：

  ```md
  # 《{title}》的批注

  > {被选中的原文}
  >
  > 批注：{note}
  > — {时间}

  ---
  ```

### 批注页（`/notes`）

- `[data-notes-archive]` 容器；`<script type="application/json" data-post-map>` 里是
  `{ [slug]: { title, category, date, url } }`。
- 按文章分组渲染（组结构可有 `.notes-archive-group`、`.notes-archive-head`、
  `.notes-archive-title`、`.notes-archive-meta`、`.notes-archive-list`、`.notes-archive-item`、
  `.notes-archive-quote`、`.notes-archive-body`、`.notes-archive-foot`）。
- 顶部：`[data-notes-total]`（N 条批注 / M 篇文章）、`[data-notes-export-all]`（`批注全集.md`）、
  `[data-notes-clear]`（二次确认后清空）。
- 无批注时显示 `[data-notes-archive-empty]`。

## 6. 移动端抽屉（目录 + 批注）

- 触发：`[data-drawer-toggle]`（`Dock` 里的按钮）与 `[data-notes-focus]`（文章头部「批注」按钮）。
- 面板：`[data-drawer-panel]`（文章页的 `.post-aside`），通过 `data-open` 属性打开。
- 遮罩：`[data-drawer-backdrop]`，点击关闭；`[data-drawer-close]` 关闭；`Esc` 关闭。
- 打开时锁 body 滚动（记录并恢复 `overflow`）。
- `[data-notes-focus]` 打开后把面板滚到批注区。

## 7. 灯箱

- `[data-lightbox]`、`[data-lightbox-img]`、`[data-lightbox-caption]`、`[data-lightbox-close]`。
- 点击 `[data-prose] img`（不在 `a` 内）打开；`alt` 或最近 `figcaption` 作为说明文字。
- `Esc` / 点击背板关闭；`←` `→` 在同页所有图片间切换；打开时锁滚动。

## 8. 代码复制

- 为 `[data-prose] pre`（排除 `.mermaid-block` 内的）注入按钮 `.copy-code`，文案「复制」。
- 点击复制 `pre code` 文本；成功后 `.is-done` + 文案「已复制」，1.6s 后恢复。

## 9. Mermaid

- 容器 `.mermaid-block[data-mermaid]`，内含 `.mermaid-fallback`（源码）。
- 若页面存在，动态 `import('mermaid')`：`mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: {...} })`。
- 用当前主题（`document.documentElement.dataset.theme`）决定深浅；`await mermaid.render(id, source)` 得到 svg，
  插入容器，加 `.is-rendered`；失败加 `.is-failed`（保留源码 + 提示）。
- 监听 `ink:themechange` 重新渲染（先移除已插入 svg、恢复 `.mermaid-fallback`）。
- 主题配色：纸 `#f6f2e8`/`#14130f`，墨 `#24211c`/`#e8e1d2`，线 `#d1c5ab`/`#3d382e`，强调 `#9c4033`/`#c47b68`。

## 10. 轻量动效与其它

- `[data-reveal]`：IntersectionObserver 进入视口后加 `.is-in`（已有一版实现，可扩展为 stagger）。
- `[data-to-top]`：`scrollY > 640` 时加 `.is-visible`；点击平滑回顶。
- Toast：`[data-toast]`，函数 `toast(text)` 显示 1.8s（`is-visible` class）。
- 统一键盘：`Ctrl/Cmd+K`、`/` 开面板；`Esc` 关闭最上层浮层；`T` 切主题。
