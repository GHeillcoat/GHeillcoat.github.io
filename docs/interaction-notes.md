# 交互层说明（`src/scripts/`）

单个入口：`src/scripts/app.ts`，由 `BaseLayout` 以 `<script>import '../scripts/app'</script>` 引入。
每个模块自己检查 DOM 是否存在，不存在就直接返回，所以全站只加载一个 bundle。

## 结构

```
app.ts            按顺序初始化：theme / header / reveal / palette / drawer / toc /
                  lightbox / code-copy / mermaid / notes / notes-archive / keyboard
lib/dom.ts        toast、剪贴板、文件下载、滚动锁（含滚动条宽度补偿）
lib/scroll.ts     单滚动监听 + rAF 节流 + passive
lib/overlay.ts    浮层栈（按 z-index 排序，Esc 只关最上层）
lib/notes-store.ts   localStorage['ink:notes:v1'] 读写、校验、降级
lib/notes-markdown.ts 批注导出为 Markdown
theme.ts          主题切换（`ink:themechange` 事件、跟随系统、快捷键 T）
header.ts         页眉滚动状态、移动端菜单、阅读进度、回到顶部
palette.ts        命令面板：Ctrl/Cmd+K 与 `/`；生产用 Pagefind，dev 用 `script[data-post-index]`
toc.ts            目录 scrollspy
drawer.ts         移动端目录/批注抽屉（锁滚动、Esc、遮罩）
lightbox.ts       图片灯箱（←/→/Esc、锁滚动）
code-copy.ts      代码块复制按钮
mermaid.ts        按需 import、视口懒渲染（rootMargin 200px）、明暗重绘、失败回退
notes.ts          划词工具条、批注编辑器、正文高亮、面板、单篇导出
notes-archive.ts  `/notes` 页：按文章分组、全部导出、清空
reveal.ts         滚动揭示（respects prefers-reduced-motion）
keyboard.ts       全局快捷键与焦点管理
```

## 几条约定

- 性能：Pagefind 只在生产环境 import；Mermaid 只在图块进入视口附近时 import，并用
  `layout: 'dagre'` 避免拉入 1.4 MB 的 ELK；滚动统一走 `lib/scroll.ts`。
- 安全：所有用户输入（批注原文、内容）都用 `textContent` 写入；Pagefind 命中的
  `<mark>` 片段只提取文本与 mark。
- 无 JS：页面仍然可读；揭示动画在 `prefers-reduced-motion` 或 IO 不可用时立即显示。
- 存储：批注只存本机 `localStorage`，按 `slug + 原文 + 前后文` 定位，不跨设备同步。
- 批注导出的文件名：单篇 `批注-{标题}.md`，全部 `批注全集.md`。
