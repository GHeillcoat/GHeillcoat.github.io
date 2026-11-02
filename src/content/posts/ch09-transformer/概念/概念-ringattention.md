---
title: "概念-RingAttention"
description: "Ring Attention 是一种分布式注意力计算算法，旨在突破 GPU 显存限制，实现百万级 token 的上下文窗口训练和推理。Ring Attention 将长序列切分到多个设备（GPU）上，通过环形通信（Ring Communication）在设备间传递 key-val"
pubDate: 2026-07-01
category: "Ch09 Transformer"
---
## 概述

Ring Attention 是一种分布式注意力计算算法，旨在突破 GPU 显存限制，实现百万级 token 的上下文窗口训练和推理。Ring Attention 将长序列切分到多个设备（GPU）上，通过环形通信（Ring Communication）在设备间传递 key-value 块（KV blocks），使每个设备都能计算完整的注意力，而无需在单个设备上存储完整的 KV cache。

## 核心原理

### 长上下文的显存瓶颈

标准自注意力机制的空间复杂度为 $O(n^2)$，其中 $n$ 是序列长度。对于 100 万 token 的序列，即使使用 FlashAttention 优化，KV cache 在单个 GPU 上仍然需要数百 GB 显存，远超现有硬件能力。

### Ring Attention 工作机制

Ring Attention 将序列均匀分配到 $N$ 个 GPU 上，每个 GPU 负责长度为 $n/N$ 的序列块。其核心流程如下：

1. **初始分布**：Query（Q）分布在各自 GPU 上，Key-Value（KV）按块分布在所有 GPU 上。
2. **环形通信**：每个 GPU 计算本地 Q 与本地 KV 的注意力，然后将 KV 块传递给下一个 GPU（环形拓扑）。
3. **迭代完成**：经过 $N$ 轮通信，每个 GPU 都与所有 KV 块计算了注意力，完成全局注意力计算。
4. **输出聚合**：每个 GPU 输出其负责的序列块的注意力结果。

### 数学形式

设序列长度为 $L$，$N$ 个 GPU，每个 GPU 负责 $L/N$ 个 token。对于第 $i$ 个 GPU：

$$\text{Attention}(Q_i, K, V) = \text{Softmax}\left(\frac{Q_i K^T}{\sqrt{d_k}}\right) V$$

通过分块计算和在线 Softmax（Online Softmax），Ring Attention 在数学上等价于标准注意力，但显存占用降低到 $O(L/N)$。

## 与其他注意力优化对比

| 维度 | FlashAttention | Ring Attention | Striped Attention | FlashAttention-3 |
|------|---------------|----------------|-------------------|-----------------|
| **优化目标** | 减少 HBM 读写，加速单 GPU 注意力 | 分布式长序列，突破单 GPU 显存限制 | 分布式长序列 + 负载均衡 | 结合 FlashAttention 和 Ring Attention |
| **核心技术** | Tiling + 重计算（Recomputation） | 环形通信传递 KV 块 | 交错分配 token 到 GPU | 异步通信 + 计算重叠 |
| **序列长度支持** | 受单 GPU 显存限制（~128K） | 百万级（1M+） | 百万级（1M+） | 百万级（1M+） |
| **GPU 数量** | 1 | 多 GPU（N） | 多 GPU（N） | 多 GPU（N） |
| **通信模式** | 无 | 环形（Ring） | 交错（Striped） | 环形 + 异步 |
| **计算效率** | 极高（3-5x） | 高（受通信带宽限制） | 中高（负载均衡更好） | 极高（接近 FlashAttention 效率） |
| **显存效率** | $O(n)$ | $O(n/N)$ | $O(n/N)$ | $O(n/N)$ |
| **提出时间** | 2022 | 2023 | 2023 | 2024-2025 |
| **代表实现** | Dao-AILab | UC Berkeley / LMSys | Together AI | Dao-AILab (Tri Dao) |

## 技术深度

### 在线 Softmax（Online Softmax）

Ring Attention 的关键技术之一是**在线 Softmax**，它允许在分块计算注意力时维护正确的全局 Softmax 归一化：

对于每个 KV 块，维护：
- **局部最大值** $m_i$：当前块内的最大注意力分数
- **局部和** $\ell_i$：当前块内的 Softmax 分母

当新的 KV 块到来时，使用以下修正公式更新全局结果：

$$m_{new} = \max(m_{old}, m_{block})$$
$$\ell_{new} = \ell_{old} \cdot e^{m_{old} - m_{new}} + \ell_{block} \cdot e^{m_{block} - m_{new}}$$

### 通信-计算重叠

Ring Attention 的通信开销是其主要瓶颈。在 FlashAttention-3 中，通过异步通信和计算重叠，将通信隐藏在计算中：

- 当前 KV 块在计算注意力时，同时从上一个 GPU 接收下一个 KV 块。
- 使用 CUDA 异步拷贝（Async Copy）和 Tensor Memory Accelerator（TMA）实现。

### 与模型并行的关系

Ring Attention 通常与以下并行策略结合使用：

| 并行策略 | 划分维度 | 与 Ring Attention 的关系 |
|----------|----------|--------------------------|
| **数据并行（DP）** | 批次维度 | 互补，可同时使用 |
| **张量并行（TP）** | 模型参数维度 | 互补，Ring Attention 处理序列维度 |
| **流水线并行（PP）** | 模型层维度 | 互补，可组合成 3D 并行 |
| **序列并行（SP）** | 序列维度 | Ring Attention 是序列并行的一种实现 |

## 2026年：超长上下文的标准方案

2026 年，Ring Attention + FlashAttention-3 已成为训练和部署超长上下文模型的标准组合：

| 模型 | 最大上下文 | 注意力方案 | 提出时间 |
|------|------------|------------|----------|
| Gemini 3.5 Pro | 2M tokens | Ring Attention + FA3 | 2025 |
| GPT-5.5 | 1M tokens | 未公开（推测 Ring Attention 变体） | 2025 |
| Claude 4 | 500K tokens | 未公开 | 2025 |
| Llama 4 | 1M tokens | Ring Attention + FA3 | 2025 |
| Mistral 3 | 512K tokens | Ring Attention + FA3 | 2025 |
| DeepSeek-V4 | 256K tokens | MLA + Ring Attention | 2025 |

## 应用场景

- **长文档理解**：处理整本书、法律合同、学术论文全集
- **代码库级理解**：一次性分析数百万行代码的完整仓库
- **多轮对话**：无限的对话历史，无需滑动窗口截断
- **视频理解**：逐帧分析长视频（数小时）
- **DNA 序列分析**：处理超长基因序列
- **金融时间序列**：分析数年的高频交易数据

## 相关笔记

- [[Ch09 Transformer 架构精讲]]：Transformer 注意力机制深度解析
- [[Ch10 LLM 原理与架构演进]]：LLM 架构演进，包括长上下文扩展
- [[概念-上下文窗口]]：上下文窗口的概念、扩展技术与挑战
- [[概念-DeepSeek]]：DeepSeek 的 MLA（Multi-head Latent Attention）与长上下文
- [[概念-vLLM]]：vLLM 推理引擎的长上下文支持

## 来源

- Ring Attention 论文: "Ring Attention with Blockwise Transformers for Near-Infinite Context" (2023): https://arxiv.org/abs/2310.01889
- FlashAttention 论文: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness" (2022): https://arxiv.org/abs/2205.14135
- FlashAttention-3 论文: "FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-Precision" (2024): https://arxiv.org/abs/2407.08608
- Striped Attention 论文: "Striped Attention: Faster Ring Attention for Causal Transformers" (2023): https://arxiv.org/abs/2311.09431
- Ring Attention GitHub: https://github.com/lhao499/RingAttention
- Dao-AILab FlashAttention: https://github.com/Dao-AILab/flash-attention