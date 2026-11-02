---
title: "2.3 Jupyter Notebook实战：AI开发的交互式工作台"
description: "Jupyter Notebook 是一个在浏览器里运行的交互式编程环境。它和普通 .py 文件最大的区别是：代码分\"单元格\"（cell）运行，中间结果自动保留在内存里。"
pubDate: 2026-06-30
updatedDate: 2026-07-06
category: "Ch02 Python与数据科学"
tags: ["基础", "Python"]
aliases: ["Jupyter Notebook实战：AI开发的交互式工作台", "2.3 Jupyter Notebook实战-AI开发的交互式工作台"]
---
### 2.3.1 为什么AI开发都用Jupyter

Jupyter Notebook 是一个在浏览器里运行的交互式编程环境。它和普通 `.py` 文件最大的区别是：**代码分"单元格"（cell）运行，中间结果自动保留在内存里**。

这对 AI 开发至关重要，因为：

- 加载一次模型可能要 30 秒到几分钟，如果在 `.py` 文件里每次改了代码都要重新加载模型，一天 8 小时可能有 4 小时在等模型加载。
- 在 Jupyter 里，你加载一次模型，然后反复测试不同的 prompt、不同的参数，模型一直在内存里，秒级出结果。
- 你可以随时查看中间变量的值，不需要 `print()` 满天飞。
- 图文混排：Markdown 说明 + 代码 + 输出图表全在一个页面里，天然适合做实验记录。

### 2.3.2 基本操作

| 操作 | 快捷键/方法 | 说明 |
|---|---|---|
| 运行当前 cell | `Shift + Enter` | 执行代码并跳到下一个 cell |
| 新建 cell | `Esc` 然后 `b`（下方）或 `a`（上方） | 在命令模式下操作 |
| 删除 cell | `Esc` 然后 `d` 两次 | 命令模式下连按两次 d |
| 切换 cell 类型 | `Esc` 然后 `m`（Markdown）或 `y`（代码） | 写文档用 Markdown，写代码用 Code |
| 重启内核 | Kernel → Restart | 清空所有变量，从头开始 |
| 中断执行 | Kernel → Interrupt 或工具栏方块按钮 | 代码跑飞了按这个 |

### 2.3.3 Jupyter Notebook vs .py 文件

| | Jupyter Notebook (`.ipynb`) | Python 脚本 (`.py`) |
|---|---|---|
| 运行方式 | 逐个 cell 运行，结果保留在内存 | 一次性从头运行到尾 |
| 适合场景 | 数据探索、模型实验、可视化、学 AI | 最终部署、生产环境、自动化脚本 |
| 查看中间结果 | 天然支持，每个 cell 输出直接显示 | 需要手动 print 或调试器 |
| 版本管理 | 麻烦（JSON 格式，diff 不友好） | 友好（纯文本，git diff 清晰） |
| 典型工作流 | 用 Jupyter 做实验，确认可行后把代码搬到 `.py` 文件里部署 | |

### 2.3.4 零基础5分钟上手

1. 安装：`pip install jupyterlab`（推荐 JupyterLab，比经典 Notebook 更好用）
2. 启动：终端输入 `jupyter lab`，浏览器会自动打开
3. 新建 Notebook：点击 `Python 3` 图标
4. 第一个 cell 输入 `print("Hello AI")`，按 `Shift + Enter` 运行
5. 第二个 cell 输入 `import pandas as pd; print(pd.__version__)`，验证库已安装

搞定。你已经在用 Jupyter 了。

---

> ← 上一节：[[2.2 Python环境管理-venv vs conda vs poetry vs uv]] ｜ 下一节：[[2.5 零基础最需要的 5 个 Python 库]] →
