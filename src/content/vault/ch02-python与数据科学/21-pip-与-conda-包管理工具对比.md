---
title: "2.1 pip 与 conda：包管理工具对比"
description: "在开始写 Python 代码之前，你必然会遇到一个问题：怎么安装那些别人写好的库？"
date: 2026-06-30
updated: 2026-07-02
category: "Ch02 Python与数据科学"
tags: ["基础", "Python"]
aliases: ["pip 与 conda：包管理工具对比", "2.1 pip 与 conda-包管理工具对比"]
chapter: "Ch02"
section: "2.1"
source: "笔记/Ch02 Python与数据科学/2.1 pip 与 conda-包管理工具对比.md"
---
## 2.1.1 概念：包管理器是什么

在开始写 Python 代码之前，你必然会遇到一个问题：怎么安装那些别人写好的库？

想象你要装修一套房子。你可以自己去木材市场挑木板、去五金店买螺丝、去化工厂买油漆原料自己调配——这就是"从零写代码"。正常人不会这么干，你会直接去宜家买现成的家具，拿回家组装就行。Python 的**包**（package）就是别人写好的"现成家具"，而**包管理器**（package manager）就是帮你订货、送货、安装的工具。你只需要说"我要一个 NumPy"，包管理器就自动帮你下载、解压、放到正确的位置、配置好依赖关系。

Python 生态有两个主流的包管理器：**pip** 和 **conda**。它们都能装包，但设计哲学完全不同。pip 是 Python 官方自带的"快递员"，只负责送 Python 包。conda 是"全屋定制设计师"，不仅送包，还帮你管理 Python 本身、C 语言底层库、甚至 GPU 驱动——凡是你的 AI 项目依赖的东西，conda 都能管。

这个区别决定了你的选择：纯 Python 项目用 pip 就够了，但一旦涉及数据科学和深度学习，conda 能帮你省下大量折腾环境的时间 ^[CodeGym, "Conda vs pip vs uv: The 2026 Decision Guide", 2026, https://codegym.cc/groups/posts/python-conda-vs-pip-vs-uv]。

## 2.1.2 教学：pip 和 conda 怎么用

### pip：Python 官方的"快递员"

pip 随 Python 一起安装，不需要额外操作。打开终端，输入以下命令就能安装任何 PyPI（Python Package Index，Python 的官方包仓库）上的库：

```bash
pip install numpy          # 安装 NumPy
pip install pandas matplotlib  # 一次装多个
pip install --upgrade numpy    # 升级 NumPy 到最新版
pip uninstall numpy            # 卸载
pip list                       # 查看已安装的所有包
```

pip 的工作方式很简单：你去 PyPI 上"下单"，它帮你在当前 Python 环境里"卸货"。但它不管这个"货"和你已有的其他"家具"会不会冲突——比如包 A 要求 NumPy 1.x，包 B 要求 NumPy 2.x，pip 可能两个都装上，最后运行时报错。这叫**依赖冲突**（dependency conflict），是 pip 最大的软肋。

### conda：全屋定制的"设计师"

conda 需要单独安装。推荐安装 **Miniconda**（精简版，只含 conda 命令行工具），而不是完整的 Anaconda（预装 250+ 库，占用 3GB 空间）。去 https://docs.anaconda.com/miniconda/ 下载安装。

```bash
# conda 基础命令
conda create -n myenv python=3.12  # 创建独立环境，指定 Python 版本
conda activate myenv               # 激活环境
conda install numpy pandas         # 安装包
conda install -c conda-forge jupyter  # 从 conda-forge 频道安装
conda list                         # 查看已安装的包
conda deactivate                   # 退出环境
```

conda 和 pip 最大的技术区别在于**依赖解析方式** ^[conda.org, "Conda and pip are two ecosystems, not just tools", 2026, https://conda.org/blog/2026-05-07-conda-and-pip-ecosystems/]：

- pip 采用**递归安装**——来一个装一个，装到后面发现冲突已经晚了。
- conda 采用**SAT 求解器**——把所有的包和它们的版本要求当做一道数学题，在安装之前就算出所有包都能和谐共处的版本组合。如果无解，它会直接告诉你"不可能"，而不是悄悄制造一个会在半夜爆炸的环境。

### 核心对比表

| | pip | conda |
|---|---|---|
| 来源 | Python 官方自带 | 需单独安装（Miniconda/Anaconda） |
| 管理范围 | 只管 Python 包 | Python 包 + 非 Python 依赖（C 库、CUDA、系统工具） |
| 安装来源 | PyPI（Python 官方仓库） | conda 频道（conda-forge、anaconda 等） |
| 依赖解析 | 递归安装，可能冲突 | SAT 求解器，全局一致性保证 |
| 速度 | 中等 | 依赖解析较慢，但 mamba 替代品可解决 |
| 环境管理 | 需配合 venv | 内置，且可管理不同 Python 版本 |
| 适用场景 | 纯 Python 项目、Web 应用 | 数据科学、深度学习、需要 GPU 的项目 |

## 2.1.3 注意事项：最常见的坑

**规则一：不要混用 pip 和 conda 装同一个包。** 这是新手最常见的错误。如果你用 conda 装了 NumPy，然后又用 pip 升级了 NumPy，conda 管理的其他依赖（如 SciPy、pandas）可能瞬间崩溃，因为它们依赖的底层 C 库版本对不上了 ^[Tencent Cloud Developer, "Conda 与 pip 使用指南：核心原则与避坑技巧", 2026, https://grapecity.csdn.net/694ca4f4bf6b0e4b285e2f52.html]。

正确的混合使用顺序是：**先 conda 装底层库，再 pip 装纯 Python 包。**

```bash
conda create -n myproject python=3.12
conda activate myproject
conda install numpy scipy pandas matplotlib  # conda 装底层库
pip install flask requests                    # pip 装纯 Python 包（放在最后）
```

**规则二：永远不要往 base 环境（conda 默认环境）里装项目依赖。** 把 base 当成工具箱，每个项目单独创建一个环境。这就像你不会把全家的衣服都堆在客厅沙发上——一个项目一个"房间"。

**规则三：使用 channel_priority strict。** conda 的频道（channel）就像不同的超市。conda-forge 是一个社区维护的大型"超市"，包更新、更全。anaconda 默认频道是"官方超市"，有些包版本较旧。如果你同时从多个频道拿货，conda 的 SAT 求解器会算得很慢。设置严格优先级能大幅加速：

```bash
conda config --set channel_priority strict
```

## 2.1.4 关联：从包管理到环境管理

理解 pip 和 conda 的区别后，下一步自然的问题是：我怎么管理不同的项目环境？这就是 [[2.2 Python环境管理-venv vs conda vs poetry vs uv|2.2 节]] 要解决的问题。简而言之：

- 如果你用 conda，环境管理已经内置了（`conda create`）。
- 如果你用 pip，需要用 venv（Python 自带）来创建隔离环境。
- 2026 年的新趋势是 **uv**，一个用 Rust 重写的极速包管理器，同时替代 pip 和 venv，安装速度比 pip 快 10-100 倍。详见 2.2 节对比。

另外，包管理器的选择直接影响你在 [[2.9 从零到第一个AI程序-5步跑通你的第一个 AI 调用|2.9 节]] 中能否顺利跑通第一个 AI 程序。如果包没装对，`import requests` 直接报 `ModuleNotFoundError`。

---

> ← 上一节：[[Ch02 Python 与数据科学生态|章首]] ｜ 下一节：[[2.2 Python环境管理-venv vs conda vs poetry vs uv]] →
