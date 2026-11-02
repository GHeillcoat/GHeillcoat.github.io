---
title: "AI 3D 生成：从文字到三维世界"
description: "AI 3D 生成是 AI 内容生成的前沿领域——从文字描述或图片直接生成三维模型。2026 年，3D 生成技术已经从实验室走向生产：游戏开发、影视制作、电商展示、AR/VR 等场景开始实际使用 AI 生成的 3D 资产。"
pubDate: 2026-07-01
category: "Ch17 多模态AI"
---
## 一句话理解

AI 3D 生成是 AI 内容生成的前沿领域——从文字描述或图片直接生成三维模型。2026 年，3D 生成技术已经从实验室走向生产：游戏开发、影视制作、电商展示、AR/VR 等场景开始实际使用 AI 生成的 3D 资产。

## 3D 生成的技术路线

### 核心挑战：3D 数据的稀缺性

与 2D 图像（数十亿张）不同，高质量的 3D 模型数量极少（百万级别）。这意味着 3D 生成不能像 2D 图像生成那样直接在大规模 3D 数据上训练扩散模型。技术的发展围绕着"如何利用 2D 知识生成 3D"展开。

### 路线一：基于 2D 扩散模型的 3D 蒸馏 (Score Distillation Sampling)

**核心思想**：用 2D 图像扩散模型（如 Stable Diffusion）作为"教师"，通过 score distillation 将 2D 知识蒸馏到 3D 表示（NeRF 或 Gaussian Splatting）中。

**DreamFusion** (Google, 2022) 是这一路线的开创者。

**工作流程**：

1. 初始化一个 3D 表示（NeRF 或 3D Gaussian）
2. 从随机视角渲染一张 2D 图像
3. 给渲染图像加噪声，输入 2D 扩散模型
4. 计算 score distillation loss（SDS loss）：2D 扩散模型预测的噪声 vs 实际加入的噪声之差
5. 用 SDS loss 的梯度更新 3D 表示
6. 重复 2-5 步，从不同视角迭代

**关键公式**：SDS loss 的梯度

$$
\nabla_{\theta} \mathcal{L}_{\text{SDS}} = \mathbb{E}_{t, \epsilon} \left[ w(t) \left( \hat{\epsilon}_{\phi}(x_t; y, t) - \epsilon \right) \frac{\partial x}{\partial \theta} \right]
$$

其中 $\hat{\epsilon}_{\phi}$ 是 2D 扩散模型的噪声预测，$x$ 是渲染的 2D 图像，$y$ 是文本条件，$\theta$ 是 3D 表示的参数。

### 路线二：图像到 3D (Image-to-3D)

**核心思想**：给定一张或多张 2D 图像，直接生成 3D 模型。

**Zero-1-to-3** (2023)：用扩散模型学习"视角变换"——给定一张图像和一个相机位姿变化，生成新视角的图像。得到多视角图像后，用 NeRF 或 3D 重建方法重建 3D 模型。

**TripoSR** (Stability AI, 2024)：单张图像 1 秒内生成 3D 模型，是目前最快的方案之一。核心技术是 Large Reconstruction Model (LRM) 的 Transformer 架构。

### 路线三：大规模 3D 数据训练

**核心思想**：直接用大规模 3D 数据集训练生成模型，像 2D 扩散模型那样。

**代表模型**：

- **Rodin** (Microsoft, 2023)：用 3D 扩散模型在 3D 数据上训练，生成 3D 隐式表示
- **Meshy** (2023-2024)：商业化的 3D 生成平台，支持 text-to-3D 和 image-to-3D
- **LGM** (Large Gaussian Model, 2024)：用 Transformer 直接生成 3D Gaussian Splatting

### 3D 表示方式对比

3D 生成不仅取决于生成算法，还取决于**用什么方式表示 3D**。

| 表示方式 | 原理 | 优点 | 缺点 | 代表方法 |
|---------|------|------|------|---------|
| NeRF | 神经网络隐式表示 3D 场 | 高质量，连续表示 | 渲染慢，不易编辑 | DreamFusion |
| 3D Gaussian Splatting | 3D 高斯椭球体集合 | 渲染快，可编辑 | 点数多，几何精度低 | LGM, DreamGaussian |
| Mesh (网格) | 顶点+面片 | 标准格式，所有软件兼容 | 拓扑固定，难以表示复杂形状 | Meshy, Rodin |
| SDF (有符号距离函数) | 神经网络隐式距离场 | 几何精度高 | 渲染慢 | SDFusion |
| DMTet (可微四面体) | 可微的四面体网格 | 可微 + 标准格式 | 复杂度限制 | Magic3D |
| Triplane | 三个正交平面的特征图 | 高效 3D 表示 | 分辨率有限 | EG3D, LRM |

### 2026 年主流 3D 生成方案对比

| 方案 | 输入 | 输出格式 | 生成时间 | 质量 | 开源 | 适合场景 |
|------|------|---------|---------|------|------|---------|
| DreamFusion | 文本 | NeRF | 1-2 小时 | 中 | 是 | 创意原型 |
| Magic3D | 文本 | Mesh | 40 分钟 | 中高 | 否 | 游戏资产 |
| Zero-1-to-3 | 单张图像 | NeRF | 10 分钟 | 中 | 是 | 快速 3D 重建 |
| TripoSR | 单张图像 | Mesh | <1 秒 | 中 | 是 | 实时应用 |
| Rodin | 文本/图像 | Mesh | 5 分钟 | 高 | 否 | 高质量资产 |
| Meshy | 文本/图像 | Mesh | 1-5 分钟 | 中高 | 否 | 通用 |
| LGM | 单张/多张图像 | 3D Gaussian | 10 秒 | 中 | 是 | 快速预览 |
| InstantMesh | 单张图像 | Mesh | 5 秒 | 中 | 是 | 快速生成 |

## 核心技术详解

### NeRF (Neural Radiance Fields)

NeRF 是 3D 生成的基础技术之一。它用 MLP 网络表示一个 3D 场景的辐射场：

$$
F_{\Theta}: (x, y, z, \theta, \phi) \rightarrow (r, g, b, \sigma)
$$

输入 3D 坐标 $(x, y, z)$ 和视角方向 $(\theta, \phi)$，输出该点的颜色 $(r, g, b)$ 和密度 $\sigma$。通过体渲染（volume rendering）从任意视角渲染图像。

**NeRF 的局限**：渲染速度慢（一帧需要数秒），训练需要数小时，且难以编辑。2024-2026 年，3D Gaussian Splatting 在很多场景中取代了 NeRF。

### 3D Gaussian Splatting (3DGS)

3DGS 是 2023 年 SIGGRAPH 提出的革命性技术。它用一组 3D 高斯椭球体表示场景：

$$
G(x) = \exp\left(-\frac{1}{2}(x - \mu)^T \Sigma^{-1} (x - \mu)\right)
$$

每个高斯椭球体有位置 $\mu$、协方差 $\Sigma$、颜色和透明度。渲染时，将所有高斯投影到 2D 图像平面，按深度排序，通过 alpha blending 合成最终图像。

**3DGS 的优势**：渲染速度极快（100+ FPS），远快于 NeRF，且支持实时编辑。这使得 3DGS 成为 2024-2026 年 3D 生成的主流表示方式。

### 扩散模型在 3D 中的应用

| 应用方式 | 输入 | 输出 | 代表模型 |
|---------|------|------|---------|
| 2D 扩散 + 3D 蒸馏 | 文本 | 3D 表示 | DreamFusion, ProlificDreamer |
| 多视角扩散 | 单张图像 | 多视角图像 | Zero-1-to-3, MVDream |
| 3D 扩散 | 文本/噪声 | 3D 体素/隐式表示 | Rodin, 3DTopia |
| 2D 扩散 + 3D 重建 | 多视角图像 | 3D 模型 | TripoSR, LGM |

## 2026 年应用场景

### 游戏开发

AI 3D 生成最直接的应用场景。游戏需要大量 3D 资产（角色、道具、场景），AI 生成可以大幅降低制作成本。

| 资产类型 | 传统制作时间 | AI 生成时间 | 适用工具 |
|---------|------------|-----------|---------|
| 低面角色 | 2-5 天 | 5-30 分钟 | Meshy, Rodin |
| 道具/武器 | 1-3 天 | 1-10 分钟 | Meshy, TripoSR |
| 场景元素 | 3-10 天 | 10-60 分钟 | DreamFusion, Meshy |
| 纹理/材质 | 1-2 天 | 即时 | 各类 PBR 生成 |

### 电商展示

3D 商品展示的需求正在快速增长。AI 可以从几张产品照片生成 3D 模型，用于 AR 试穿、360 度展示等。

### AR/VR 内容

Apple Vision Pro 和 Meta Quest 的普及推动了 3D 内容需求。AI 3D 生成可以快速创建 AR/VR 中的 3D 对象和场景。

### 影视预可视化

在电影制作中，导演用 AI 3D 生成快速创建场景的 3D 模型，用于预可视化（pre-visualization）——在正式拍摄前预览场景布局和镜头运动。

## 技术挑战与未来方向

| 挑战 | 现状 (2026) | 未来方向 |
|------|-----------|---------|
| 生成质量 | 接近可用的游戏资产级别 | 达到 AAA 游戏标准 |
| 纹理质量 | PBR 材质可以生成，但不够精细 | 高分辨率 PBR 纹理 |
| 拓扑质量 | 四边形化仍然困难 | 自动重拓扑 |
| 生成速度 | 从秒级到小时级 | 实时生成 |
| 可控性 | 有限的 pose/结构控制 | 精确的几何控制 |
| 多物体场景 | 基本限于单物体 | 完整场景生成 |
| 动画支持 | 几乎不支持 | 骨骼绑定 + 动画生成 |

## 相关笔记

- [[Ch18 AI 创作这三年]] — AI 创作工具的演进
- [[Ch17 多模态 AI]] — 多模态 AI 技术体系
- [[Ch19 多模态深度原理]] — 多模态深度技术原理
- [[概念-AI视频生成]] — 视频生成模型
- [[概念-CLIP]] — 文本-图像对齐基础
- [[Ch07 CNN 与计算机视觉]] — 计算机视觉基础

## 来源

- Poole et al., "DreamFusion: Text-to-3D using 2D Diffusion" (Google, 2022) — https://arxiv.org/abs/2209.14988
- Liu et al., "Zero-1-to-3: Zero-shot One Image to 3D Object" (2023) — https://arxiv.org/abs/2303.11328
- Tochilkin et al., "TripoSR: Fast 3D Object Reconstruction from a Single Image" (Stability AI, 2024) — https://arxiv.org/abs/2403.02151
- Kerbl et al., "3D Gaussian Splatting for Real-Time Radiance Field Rendering" (SIGGRAPH 2023) — https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/
- Mildenhall et al., "NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis" (ECCV 2020) — https://arxiv.org/abs/2003.08934
- Wang et al., "Rodin: A Generative Model for Sculpting 3D Digital Avatars Using Diffusion" (Microsoft, 2023) — https://arxiv.org/abs/2212.06135
- Meshy — https://www.meshy.ai/
- Lin et al., "Magic3D: High-Resolution Text-to-3D Content Creation" (NVIDIA, 2023) — https://arxiv.org/abs/2211.10440