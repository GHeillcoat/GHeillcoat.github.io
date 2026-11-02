---
title: "CogVLM 与中文视觉语言模型生态"
description: "CogVLM 是智谱 AI 提出的视觉语言模型，其核心创新是\"深度视觉语言融合\"——不是简单地把图像编码器挂到 LLM 上，而是在 LLM 的每一层都加入视觉专家模块，让视觉和语言信息在深层交叉融合。CogVLM 与 InternVL、MiniCPM-V、Qwen-VL 等一起构"
date: 2026-07-01
category: "Ch17 多模态AI"
source: "笔记/Ch17 多模态AI/概念/概念-CogVLM.md"
---
## 一句话理解

CogVLM 是智谱 AI 提出的视觉语言模型，其核心创新是"深度视觉语言融合"——不是简单地把图像编码器挂到 LLM 上，而是在 LLM 的每一层都加入视觉专家模块，让视觉和语言信息在深层交叉融合。CogVLM 与 InternVL、MiniCPM-V、Qwen-VL 等一起构成了中国视觉语言模型的完整生态。

## 视觉语言模型的基本架构

在理解 CogVLM 之前，先理解 VL 模型的基本范式：

### 浅层融合 vs 深层融合

| 维度 | 浅层融合 (LLaVA 路线) | 深层融合 (CogVLM 路线) |
|------|---------------------|---------------------|
| 图像输入位置 | 仅输入层 (通过投影层) | 每一层都注入视觉信息 |
| 视觉-语言交互 | 仅在 LLM 的输入层 | 在 LLM 的每一层 |
| 参数量 | 轻量 (视觉投影层很少参数) | 重 (每层都有视觉专家) |
| 视觉理解深度 | 中 | 深 |
| 训练效率 | 高 | 中 |
| 代表模型 | LLaVA, Qwen-VL | CogVLM, InternVL 2.0 |

**浅层融合**的思路：用一个视觉编码器（通常是 CLIP ViT）提取图像特征，通过一个轻量的投影层（MLP 或 Q-Former）将图像特征映射到 LLM 的输入空间，然后 LLM 就像处理文本 token 一样处理图像 token。优点是简单高效，缺点是在深层处理中视觉信息会逐渐被"稀释"。

**深层融合**的思路：在 LLM 的每一层 Transformer 中，都加入一个专门的视觉专家模块（Visual Expert），让视觉信息在每一层都能与文本信息交互。优点是视觉理解更深刻，缺点是参数量更大。

## CogVLM 架构详解

### 核心组件

CogVLM 的架构由三个关键组件构成：

1. **视觉编码器 (Vision Encoder)**：基于 EVA-02 (ViT-L/14)，将图像编码为视觉 token 序列
2. **视觉专家模块 (Visual Expert Module)**：在 LLM 的每一层 Transformer 中，为自注意力层和 FFN 层各加入一个 QKV 矩阵和 FFN 的视觉专家副本
3. **基础语言模型 (Base LLM)**：基于 ChatGLM 或 Vicuna，标准的 Transformer decoder

### 视觉专家模块的工作方式

在标准的 Transformer 层中，自注意力和 FFN 操作是：

```
Hidden_states = SelfAttention(Hidden_states)
Hidden_states = FFN(Hidden_states)
```

在 CogVLM 中，每一层变成：

```
Hidden_states_text = SelfAttention_QKV_text(Hidden_states_text) + SelfAttention_QKV_visual(Hidden_states_visual)
Hidden_states = FFN_text(Hidden_states_text) + FFN_visual(Hidden_states_visual)
```

其中 `SelfAttention_QKV_visual` 和 `FFN_visual` 是视觉专家模块的参数，它们与文本侧的参数是独立的，但在每一层都进行交叉融合。

**关键设计**：视觉专家模块的参数是文本侧参数的子集，不是完整的复制——这控制了参数量增长。具体来说，视觉专家的 QKV 矩阵和 FFN 的维度是文本侧的约 1/4。

### 为什么深层融合有效

| 浅层融合的问题 | 深层融合的解决 |
|-------------|-------------|
| 视觉信息在深层 Transformer 中被稀释 | 每层都重新注入视觉信息 |
| 模型倾向于"忽略"图像细节 | 视觉专家强制模型关注视觉 |
| 细粒度视觉理解不足（如 OCR、定位） | 深层交叉使细粒度理解成为可能 |
| 幻觉问题严重（描述图像中不存在的物体） | 深层视觉锚定减少幻觉 |

## 中国视觉语言模型生态

### CogVLM 系列

| 版本 | 发布时间 | 关键特性 | 基准性能 |
|------|---------|---------|---------|
| CogVLM-17B | 2023.12 | 17B 参数，视觉专家模块 | 多项 VL benchmark SOTA |
| CogVLM2-19B | 2024.05 | 改进的视觉编码器，支持 1344x1344 分辨率 | 超越 GPT-4V 在多项任务 |
| CogVLM2-8B | 2024.07 | 轻量版，8B 参数 | 8B 级别最佳 |
| CogAgent | 2024.01 | GUI Agent 特化版 | 屏幕理解 SOTA |

### InternVL 系列

上海人工智能实验室（OpenGVLab）的系列，强调**大规模视觉预训练**。

| 版本 | 发布时间 | 关键特性 |
|------|---------|---------|
| InternVL 1.0 | 2023.12 | 6B 视觉编码器 + 语言模型，强调视觉编码器要大 |
| InternVL 1.5 | 2024.04 | 动态高分辨率，26B 参数 |
| InternVL 2.0 | 2024.07 | 多尺寸系列 (1B/2B/4B/8B/26B/76B/108B) |
| InternVL 2.5 | 2025.01 | 更强的 OCR 和文档理解 |
| InternVL 3.0 | 2025.07 | 76B 在多项 benchmark 超越 GPT-5.5 视觉能力 |

InternVL 的设计哲学与 CogVLM 不同：InternVL 更强调**视觉编码器的规模**（6B 参数的 ViT），而不是在 LLM 层中加入视觉专家。InternVL 的视觉编码器（InternViT）本身就是一个大模型，能提取更丰富的视觉特征。

### MiniCPM-V 系列

面壁智能（OpenBMB）的轻量级 VL 模型，主打**端侧部署**。

| 版本 | 发布时间 | 关键特性 | 参数量 |
|------|---------|---------|--------|
| MiniCPM-V 1.0 | 2024.02 | 轻量 VL | 2.4B |
| MiniCPM-V 2.0 | 2024.04 | 对标 GPT-4V 的轻量模型 | 2.8B |
| MiniCPM-V 2.5 | 2024.06 | 增强 OCR + 多图理解 | 8B |
| MiniCPM-V 2.6 | 2024.09 | 支持视频理解 | 8B |
| MiniCPM-V 3.0 | 2025.03 | 更强的轻量级性能 | 8B |

MiniCPM-V 的核心卖点是**小模型大能力**——2.8B 参数的模型在多项 VL benchmark 上接近甚至超过 17B 的 CogVLM。

### Qwen-VL 系列

阿里通义系列的 VL 模型。

| 版本 | 发布时间 | 关键特性 |
|------|---------|---------|
| Qwen-VL | 2023.08 | 初代，支持中文+英文 |
| Qwen-VL-Plus/Max | 2024.01 | 商业版，更强性能 |
| Qwen2-VL | 2024.08 | 支持动态分辨率、视频理解 |
| Qwen2.5-VL | 2025.01 | 更强的数学和文档理解 |
| Qwen3-VL | 2025.06 | 通义千问3视觉版 |

### 全面对比：中国 VL 模型生态

| 维度 | CogVLM2 | InternVL 3.0 | MiniCPM-V 3.0 | Qwen2.5-VL | DeepSeek-VL2 |
|------|---------|-------------|--------------|-----------|-------------|
| 开发方 | 智谱 AI | 上海 AI Lab | 面壁智能 | 阿里通义 | 深度求索 |
| 最大参数 | 19B | 76B | 8B | 72B | 7B |
| 架构路线 | 深层融合 (视觉专家) | 大视觉编码器 | 轻量 + 适配 | 浅层融合 (类LLaVA) | 混合 |
| 视觉编码器 | EVA-02 | InternViT-6B | SigLIP | ViT-bigG | SigLIP |
| 中文能力 | 强 | 强 | 强 | 最强 | 强 |
| 英文能力 | 强 | 强 | 中 | 强 | 强 |
| 分辨率支持 | 1344x1344 | 动态高分辨率 | 动态 | 动态 | 动态 |
| 视频理解 | 有限 | 支持 | 支持 | 强 | 支持 |
| 开源 | 是 | 是 | 是 | 部分 | 是 |
| 部署难度 | 中 (需要专用 kernel) | 高 (视觉编码器大) | 低 (端侧) | 中 | 低 |
| 适合场景 | 精细视觉理解 | 通用 VL | 端侧/移动端 | 中文生态 | 通用 |

### 2026 年：中国 VL 生态的格局

2026 年中国 VL 模型生态的几个关键趋势：

1. **多尺寸覆盖**：从 1B 到 76B 的完整覆盖，从端侧到云端都有成熟方案
2. **视频理解成为标配**：2025 年后所有主流 VL 模型都支持视频输入
3. **GUI Agent 成为新方向**：CogAgent、UI-TARS 等专注于屏幕理解和操作的模型兴起
4. **开源生态成熟**：中国 VL 模型的开源质量在 2026 年已接近甚至超过国际开源模型（如 LLaVA-NeXT）
5. **与 LLM 深度耦合**：VL 模型不再被视为"LLM + 视觉编码器"的简单组合，而是原生多模态模型

## 技术路线选择

| 场景 | 推荐模型 | 原因 |
|------|---------|------|
| 精细视觉理解 (OCR, 定位) | CogVLM2 | 深层融合对细粒度理解最好 |
| 通用 VL 应用 | InternVL 3.0 | 性能最强，多尺寸可选 |
| 端侧/移动端部署 | MiniCPM-V 3.0 | 8B 参数，端侧可用 |
| 中文生态集成 | Qwen2.5-VL | 阿里云生态，API 稳定 |
| 低成本部署 | DeepSeek-VL2 | 7B 参数，性能优异 |

## 相关笔记

- [[Ch17 多模态 AI]] — 多模态 AI 技术体系
- [[概念-LLaVA]] — 浅层融合路线的代表模型
- [[Ch10 LLM 原理与架构演进]] — LLM 架构基础
- [[概念-CLIP]] — 视觉语言对齐的基础
- [[Ch19 多模态深度原理]] — 多模态深度技术原理
- [[概念-AI视频生成]] — 视频生成模型

## 来源

- Wang et al., "CogVLM: Visual Expert for Pretrained Language Models" (2023) — https://arxiv.org/abs/2311.03079
- Hong et al., "CogVLM2: Visual Language Models for Image and Video Understanding" (2024) — https://arxiv.org/abs/2408.16500
- Chen et al., "InternVL: Scaling up Vision Foundation Models and Aligning for Generic Visual-Linguistic Tasks" (2024) — https://arxiv.org/abs/2312.14238
- Chen et al., "InternVL 2.0: Expand the Visual Capabilities of Large Vision-Language Models" (2024) — https://arxiv.org/abs/2407.14842
- Yao et al., "MiniCPM-V: A GPT-4V Level MLLM on Your Phone" (2024) — https://arxiv.org/abs/2408.01800
- Bai et al., "Qwen-VL: A Versatile Vision-Language Model" (2023) — https://arxiv.org/abs/2308.12966
- CogVLM GitHub — https://github.com/THUDM/CogVLM2