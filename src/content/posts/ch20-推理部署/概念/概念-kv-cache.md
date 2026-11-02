---
title: "KV Cache (Key-Value 缓存)"
description: "KV Cache（Key-Value 缓存）是 Transformer 自回归解码（Autoregressive Decoding）中的一项核心推理优化技术。在生成文本时，模型每生成一个 token 都需要计算所有历史 token 的注意力。如果不做缓存，每个新 token 都要"
pubDate: 2026-07-01
category: "Ch20 推理部署"
tags: ["LLM推理", "注意力机制", "性能优化", "Transformer"]
aliases: ["KV Cache", "Key-Value Cache", "KV缓存", "键值缓存"]
---
## 概述

KV Cache（Key-Value 缓存）是 Transformer 自回归解码（Autoregressive Decoding）中的一项核心推理优化技术。在生成文本时，模型每生成一个 token 都需要计算所有历史 token 的注意力。如果不做缓存，每个新 token 都要重新计算所有 Key 和 Value，导致计算量随序列长度呈平方增长。KV Cache 通过缓存先前时间步已计算的 Key 和 Value 矩阵，使得每个新 token 只需计算自身的 Q、K、V 并与缓存的 K、V 进行注意力计算，将推理复杂度从 $O(n^2)$ 降低到 $O(n)$。

## 工作原理

### 自回归解码的重复计算问题

在自回归生成中，第 $t$ 步的注意力计算需要当前 token 的 Query 与所有历史 token 的 Key 做点积：

$$ \text{Attention}(Q_t, K_{1:t}, V_{1:t}) = \text{softmax}\left(\frac{Q_t K_{1:t}^T}{\sqrt{d_k}}\right) V_{1:t} $$

如果没有 KV Cache，每生成一个新 token 都要重新计算 $K_{1:t}$ 和 $V_{1:t}$，造成大量重复计算。

### KV Cache 的解决方案

1. **首次推理（Prefill 阶段）**：输入 prompt 的所有 token，计算完整的 K、V 矩阵并存入缓存
2. **逐 token 生成（Decode 阶段）**：每生成一个新 token，只计算该 token 的 K、V，追加到缓存中；注意力计算仅用新 Q 与缓存中的全部 K、V 交互
3. **缓存复用**：同一对话轮次内，历史 token 的 K、V 无需重复计算

## KV Cache 的内存分析

### 内存占用公式

对于一个 $L$ 层的 Transformer 模型，KV Cache 占用的总内存为：

$$ \text{Memory} = 2 \times L \times n \times d \times \text{precision} $$

其中：
- $L$：层数
- $n$：序列长度（缓存的 token 数）
- $d$：每层的隐藏维度
- $\text{precision}$：精度（FP16 = 2 bytes, FP32 = 4 bytes）

### 典型模型的内存占用

| 模型 | 参数量 | 层数 L | 隐藏维度 d | 1K tokens 缓存 | 32K tokens 缓存 | 128K tokens 缓存 |
|------|--------|--------|-----------|---------------|----------------|-----------------|
| LLaMA-2-7B | 7B | 32 | 4096 | 0.5 GB | 16 GB | 64 GB |
| LLaMA-2-70B | 70B | 80 | 8192 | 2.5 GB | 80 GB | 320 GB |
| GPT-3-175B | 175B | 96 | 12288 | 4.5 GB | 144 GB | 576 GB |
| Mixtral-8x7B | 47B | 32 | 4096 | 0.5 GB | 16 GB | 64 GB |

## KV Cache 优化技术

| 优化技术 | 原理 | 压缩率 | 精度损失 | 代表性工作 |
|----------|------|--------|---------|-----------|
| **Multi-Query Attention (MQA)** | 所有 head 共享一组 K、V | 减少 h 倍 | 微小 | PaLM, Falcon |
| **Grouped-Query Attention (GQA)** | 将 head 分组，组内共享 K、V | 减少 g 倍 | 极小 | LLaMA-2, LLaMA-3 |
| **量化 KV Cache (KV-Quant)** | 对缓存的 K、V 进行低精度量化 | 2-4x | 可控 | FlexGen, KIVI |
| **滑动窗口 (Sliding Window)** | 只缓存最近 W 个 token 的 K、V | 取决于 W | 上下文窗口受限 | Mistral |
| **KV Cache 淘汰 (Eviction)** | 丢弃不重要的 token 的缓存 | 自适应 | 可接受 | H2O, StreamingLLM |
| **跨层共享 (Cross-Layer Sharing)** | 相邻层共享 KV Cache | 减少 L 倍 | 中等 | YOCO, CLA |
| **PagedAttention** | 将 KV Cache 分页管理，减少碎片 | 内存利用率提升 | 无 | vLLM |

## 2026 年长上下文与 KV Cache 的挑战

2026 年，LLM 的上下文窗口普遍达到 1M+ tokens（如 Gemini 2.5 Pro 的 2M，Claude 的 200K+），KV Cache 面临巨大挑战：

1. **内存爆炸**：1M tokens 的 KV Cache 可能占用数百 GB 显存
2. **解码延迟**：即使缓存了 K、V，注意力计算随序列长度增长
3. **解决方案**：混合注意力（Hybrid Attention，局部全注意力 + 远程稀疏注意力）、KV Cache 压缩（通过学习哪些 token 的 KV 可丢弃）、以及硬件层面的改进（如 HBM 容量提升）

## 相关笔记

- [[概念-Transformer]] - Transformer 架构中的注意力机制
- [[深挖-长上下文]] - 长上下文的技术挑战与 KV Cache 的关系
- [[概念-注意力机制]] - 注意力机制的基础原理
- [[概念-Mamba]] - 无 KV Cache 的替代架构

## 来源

- Vaswani et al. (2017) - "Attention Is All You Need": https://arxiv.org/abs/1706.03762
- vLLM 文档 - PagedAttention: https://docs.vllm.ai/en/latest/dev/kernel/paged_attention.html
- Shazeer (2019) - "Fast Transformer Decoding: One Write-Head Is All You Need" (MQA): https://arxiv.org/abs/1911.02150
- Ainslie et al. (2023) - "GQA: Training Generalized Multi-Query Transformer Models": https://arxiv.org/abs/2305.13245
- Kwon et al. (2023) - "Efficient Memory Management for Large Language Model Serving with PagedAttention": https://arxiv.org/abs/2309.06180