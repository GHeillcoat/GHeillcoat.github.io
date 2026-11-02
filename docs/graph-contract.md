# 知识图谱引擎契约（`src/scripts/graph.ts`）

目标是「纯显示的 Obsidian 图谱」：Canvas 2D、零依赖、可拖动缩放、点击跳转。
不需要编辑、不需要实时同步、不做本地文件系统。

## DOM（已存在，不要改模板）

```html
<div class="graph-panel" data-graph data-graph-mode="global|local"
     data-graph-focus="当前文章 id（local 模式）" data-graph-height="620">
  <canvas data-graph-canvas role="img" aria-label="…"></canvas>
  <div class="graph-tip" data-graph-tip hidden></div>
  <div class="graph-controls">
    <button data-graph-zoom-in>＋</button>
    <button data-graph-zoom-out>－</button>
    <button data-graph-reset>重置</button>
  </div>
  <p class="graph-hint">…</p>
  <script type="application/json" data-graph-data>{…}</script>
</div>
```

数据：

```json
{
  "nodes": [{ "id": "slug", "title": "标题", "category": "札记", "url": "/posts/slug", "degree": 3 }],
  "edges": [{ "source": "slug-a", "target": "slug-b" }]
}
```

- `global`：整站图谱（`/graph` 页）
- `local`：文章页局部图谱（当前文章 + 一跳邻居），`data-graph-focus` 是中心节点 id

## 必须实现

1. **自适应尺寸**：canvas 按容器宽度和 `data-graph-height` 设置逻辑尺寸，乘以 `devicePixelRatio`；
   容器变化时用 `ResizeObserver` 重设并重绘。图例/提示文字由模板负责，canvas 内只画节点与连线。
2. **布局**：简单力导向即可（斥力 + 边弹簧 + 向心重力 + 阻尼），节点数 ≤ 200 时 O(n²) 足够。
   初值用圆周/螺旋分布，避免全叠在原点。alpha 衰减到阈值后停止 rAF（静止时不要空转）。
3. **local 模式**：中心节点固定在视觉中心附近（可微调），邻居环绕；节点少时半径更小。
4. **交互**：
   - 拖动节点（拖动期间暂停模拟或只固定该节点）
   - 拖动空白处平移画布
   - 滚轮以光标为中心缩放（0.4–2.5），控制按钮 +/− 以中心缩放，「重置」回到初始视图
   - hover：高亮该节点与相邻边，其余淡化；显示 `[data-graph-tip]`（标题 / 分类 / 链接数），跟随光标并保持在容器内
   - 点击节点：`location.href = node.url`
   - 触摸：单指平移、双指捏合缩放、点按节点跳转
5. **主题**：颜色一律从 CSS 变量读取（`--paper-raised`、`--line`、`--line-strong`、`--ink`、`--ink-soft`、`--ink-mute`、`--cinnabar`、`--gold`）。
   监听 `ink:themechange` 重新取色并重绘（不重新布局）。
6. **无障碍 / 性能**：
   - canvas 已有 `aria-label`，不要清空；图谱页外侧的「全部笔记」列表承担键盘可达性
   - `prefers-reduced-motion: reduce`：同步跑若干次迭代后直接绘制一次，不做逐帧动画
   - 每帧只做一次 `clearRect` + 批量 path；文字只在悬停/高亮/缩放足够大时绘制，避免满屏小字
   - 滚动、缩放等监听用 `{ passive: true }`（滚轮缩放需要 `preventDefault`，只绑在 canvas 上且显式声明 passive:false）
7. **健壮性**：JSON 解析失败、Canvas 2D 不可用、容器尺寸为 0 时静默降级（不要抛错、不要留 loading 态）。
8. 入口导出 `initGraph()`，由 `src/scripts/app.ts` 调用；全站只加载一次。

## 验收

- `/graph` 页：节点与线出现，拖拽/缩放/悬停/点击可用；明暗切换后颜色跟着变；窗口缩放不错位。
- 文章页「关联」里的局部图谱：中心节点是当前文章，邻居正确，不出现不相干节点。
- 无 console 错误；静止时无持续 rAF 占空（可用 Performance 面板确认）。
- 390 宽移动端可平移/缩放，不产生页面横向滚动。
