---
title: "2.2 Python环境管理：venv vs conda vs poetry vs uv"
description: "当你开始做多个项目时，不同项目可能需要不同版本的 Python 和库。比如项目 A 用 Python 3.11 + NumPy 1.x，项目 B 用 Python 3.12 + NumPy 2.x。如果全装在全局环境里，版本冲突会让你痛不欲生。解决方案是虚拟环境——每个项目拥有独"
date: 2026-06-30
updated: 2026-07-06
category: "Ch02 Python与数据科学"
tags: ["基础", "Python"]
aliases: ["Python环境管理：venv vs conda vs poetry vs uv", "2.2 Python环境管理-venv vs conda vs poetry vs uv"]
chapter: "Ch02"
section: "2.2"
source: "笔记/Ch02 Python与数据科学/2.2 Python环境管理-venv vs conda vs poetry vs uv.md"
---
当你开始做多个项目时，不同项目可能需要不同版本的 Python 和库。比如项目 A 用 Python 3.11 + NumPy 1.x，项目 B 用 Python 3.12 + NumPy 2.x。如果全装在全局环境里，版本冲突会让你痛不欲生。解决方案是**虚拟环境**——每个项目拥有独立的 Python 和库，互不干扰。

### 2.2.1 四种主流方案对比

| 工具 | 类型 | 速度 | 学习曲线 | 适用场景 |
|---|---|---|---|---|
| venv | Python 自带虚拟环境 | 中等 | 低 | 简单项目，只管理 Python 包 |
| conda | 跨语言环境管理 | 中等（依赖解析慢） | 低 | 数据科学，需管理 CUDA 等底层依赖 |
| poetry | Python 项目管理 | 较慢 | 中 | 需要发布 PyPI 包的开发者 |
| uv | 新一代超快包管理器 | 极快（Rust 实现） | 低 | **2026 年推荐首选**，所有场景 |

### 2.2.2 2026 年推荐方案

**零基础/新手**：直接用 Anaconda 或 Miniconda。Anaconda 自带图形界面（Anaconda Navigator），预装了 250+ 数据科学库，开箱即用，对新手最友好。Miniconda 是精简版，只有命令行，但更轻量。

**有一定基础**：用 `uv`。它是 2025 年崛起的 Rust 实现包管理器，速度比 pip 快 10-100 倍，自带虚拟环境管理，一个命令搞定所有事。2026 年已成为 Python 社区的主流选择。

```bash
# uv 常用命令（比 pip 快得多）
uv venv                    # 创建虚拟环境
uv pip install numpy pandas  # 安装包（自动用虚拟环境）
uv pip install -r requirements.txt  # 批量安装
```

**环境管理的核心原则**：每个项目一个虚拟环境，永远不要往全局 Python 里装项目依赖。

---

> ← 上一节：[[2.1 pip 与 conda-包管理工具对比]] ｜ 下一节：[[2.3 Jupyter Notebook实战-AI开发的交互式工作台]] →
