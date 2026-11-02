---
title: "Mamba (状态空间模型)"
description: "Mamba 是由 Albert Gu 和 Tri Dao 于 2023 年提出的基于结构化状态空间模型（Structured State Space Model, SSM）的序列建模架构。它通过引入选择性扫描（Selective Scan）机制，使 SSM 的参数能够根据输入动态"
date: 2026-07-01
category: "Ch08 RNN序列模型"
tags: ["状态空间模型", "序列建模", "高效架构", "SSM"]
aliases: ["Mamba", "State Space Model", "状态空间模型", "SSM", "线性复杂度"]
prerequisites: "概念-Transformer,概念-注意力机制"
source: "笔记/Ch08 RNN序列模型/概念/概念-Mamba.md"
---
## 概述

Mamba 是由 Albert Gu 和 Tri Dao 于 2023 年提出的基于**结构化状态空间模型（Structured State Space Model, SSM）**的序列建模架构。它通过引入**选择性扫描（Selective Scan）**机制，使 SSM 的参数能够根据输入动态变化，从而克服了先前 SSM 模型（如 S4）在内容依赖推理上的不足。Mamba 的核心优势在于实现了**线性时间复杂度**（$O(n)$），同时保持了与 Transformer 相当的建模能力，特别适合超长序列处理。

## 为什么需要 Mamba

Transformer 的 Self-Attention 计算复杂度为 $O(n^2)$，在处理长序列时面临严峻挑战：

| 序列长度 | Transformer 注意力计算量 | Mamba 计算量 | 加速比 |
|---------|----------------------|-------------|--------|
| 1K | 1M | 1K | 1000x |
| 8K | 64M | 8K | 8000x |
| 32K | 1B | 32K | 32768x |
| 128K | 16B | 128K | 131072x |
| 1M | 1T | 1M | 1000000x |

## 核心原理

### 状态空间模型 (SSM) 基础

传统 SSM 通过以下方程将一维输入 $u(t)$ 映射到输出 $y(t)$：

$$ h'(t) = A h(t) + B u(t) $$
$$ y(t) = C h(t) + D u(t) $$

其中 $h(t)$ 是隐状态，$A, B, C, D$ 是参数矩阵。

离散化后（使用零阶保持 ZOH）：

$$ h_k = \bar{A} h_{k-1} + \bar{B} u_k $$
$$ y_k = C h_k $$

这类似于 RNN 的递推形式，但参数来自连续时间系统的离散化。

### Mamba 的关键创新：选择性扫描

Mamba 的核心突破在于让 SSM 参数 $B, C$ 和离散化步长 $\Delta$ 成为**输入的线性函数**：

$$ B_t = \text{Linear}_B(x_t) $$
$$ C_t = \text{Linear}_C(x_t) $$
$$ \Delta_t = \text{Softplus}(\text{Linear}_\Delta(x_t)) $$

这使得模型能够根据输入内容**选择性**地保留或遗忘信息，是 Mamba 超越 S4 等固定参数 SSM 的关键。

### Mamba 块结构

```
Input -> [LayerNorm] -> [SSM (Selective Scan)] -> [SiLU] -> [Linear] -> Output
  |                                                                    ^
  |____________________________________________________________________|
                           (残差连接)
```

## Mamba vs Transformer 对比

| 维度 | Transformer | Mamba | Mamba-2 (2024) |
|------|------------|-------|---------------|
| 核心机制 | Self-Attention | Selective SSM | Structured State Space Duality |
| 计算复杂度 | $O(n^2)$ | $O(n)$ | $O(n)$ |
| 内存复杂度 | $O(n^2)$ (注意力矩阵) | $O(n)$ | $O(n)$ |
| 推理方式 | KV Cache + 逐 token 生成 | 递推式 (类似 RNN) | 递推式 |
| 长序列处理 | 需要稀疏注意力 / 分块 | 天然适合 | 天然适合 |
| 训练并行性 | 高（注意力矩阵可并行） | 需要特殊并行算法 | 高（结构化矩阵乘法） |
| 内容依赖 | 强（注意力权重由内容决定） | 强（选择性扫描） | 强 |
| 位置编码 | 需要 | 不需要 | 不需要 |
| 上下文学习 | 强 | 中 | 中强 |
| 生态成熟度 | 极高 | 中 | 发展中 |
| 代表模型 | GPT-4, Claude, LLaMA | Mamba, Jamba | Mamba-2 |

## Mamba 家族演进

| 模型 | 年份 | 核心创新 | 参数量 | 特点 |
|------|------|---------|--------|------|
| **S4** | 2021 | 结构化 SSM，HiPPO 初始化 | 不定 | 首次展示 SSM 在长序列上的潜力 |
| **H3** | 2022 | 门控 SSM + 注意力混合 | 不定 | 改进语言建模能力 |
| **Mamba** | 2023 | 选择性扫描，输入依赖 SSM | 130M-2.8B | 线性复杂度，Transformer 级别性能 |
| **Mamba-2** | 2024 | 结构化状态空间对偶性 (SSD) | 130M-2.8B | 更快训练，与注意力有理论联系 |
| **Jamba** | 2024 | Mamba + Transformer 混合 | 52B (12B 活跃) | MoE + 混合架构 |
| **Falcon Mamba** | 2024 | 纯 Mamba 架构 | 7B | 首个 7B 级纯 SSM 模型 |
| **Mamba-3** | 2025 | 进一步改进选择性机制 | 未公开 | 尚未发布 |

## 选择性扫描的关键作用

| 能力 | 无选择性 SSM (S4) | 选择性 SSM (Mamba) |
|------|-------------------|-------------------|
| 复制任务 (Copying) | 不擅长 | 擅长 |
| 归纳头 (Induction Heads) | 不擅长 | 擅长 |
| 选择性记忆 | 不擅长 | 擅长 |
| 内容过滤 | 不擅长 | 擅长 |
| 长序列建模 | 擅长 | 擅长 |

## 2026 年趋势

1. **混合架构**：Jamba、Samba 等混合 Mamba + Transformer 的架构兴起
2. **Mamba 在视觉中的应用**：Vision Mamba (ViM) 在 CV 任务上挑战 ViT
3. **Mamba 在基因组学中的应用**：长 DNA 序列建模是 Mamba 的天然优势
4. **Mamba + MoE**：结合稀疏激活进一步降低计算成本
5. **尚不能完全替代 Transformer**：Mamba 在上下文学习（In-Context Learning）和复杂推理任务上仍落后于 Transformer

## 相关笔记

- [[概念-Transformer]] - Transformer 架构与 Mamba 的对比
- [[概念-KV-Cache]] - Transformer 推理瓶颈与 Mamba 的替代方案
- [[深挖-长上下文]] - 长上下文处理中 Mamba 的优势
- [[概念-位置编码]] - Transformer 需要位置编码，Mamba 不需要

## 来源

- Gu & Dao (2023) - "Mamba: Linear-Time Sequence Modeling with Selective State Spaces": https://arxiv.org/abs/2312.00752
- Dao & Gu (2024) - "Transformers are SSMs: Generalized Models and Efficient Algorithms Through Structured State Space Duality" (Mamba-2): https://arxiv.org/abs/2405.21060
- Gu et al. (2022) - "Efficiently Modeling Long Sequences with Structured State Spaces" (S4): https://arxiv.org/abs/2111.00396
- Lieber et al. (2024) - "Jamba: A Hybrid Transformer-Mamba Language Model": https://arxiv.org/abs/2403.19887