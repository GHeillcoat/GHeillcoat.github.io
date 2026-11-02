---
title: "概念-DeepSeek"
description: "DeepSeek（深度求索）是中国领先的 AI 研究公司，专注于大语言模型（LLM）和通用人工智能（AGI）的研究与开发。DeepSeek 以高性价比的开源模型、创新的架构设计（MoE + MLA）和独特的训练方法（GRPO）闻名，在 2024-2026 年间对全球 AI 格局产"
pubDate: 2026-07-01
category: "Ch10 LLM架构"
---
## 概述

DeepSeek（深度求索）是中国领先的 AI 研究公司，专注于大语言模型（LLM）和通用人工智能（AGI）的研究与开发。DeepSeek 以高性价比的开源模型、创新的架构设计（MoE + MLA）和独特的训练方法（GRPO）闻名，在 2024-2026 年间对全球 AI 格局产生了深远影响。

DeepSeek 的核心使命是"让 AGI 触手可及"，通过开源高性能模型和极致成本优化，推动了 AI 技术的民主化。

## DeepSeek 模型家族

### 模型演进时间线

| 版本 | 发布时间 | 参数规模 | 架构 | 训练方法 | 上下文长度 | 关键创新 |
|------|----------|----------|------|----------|------------|----------|
| DeepSeek-V2 | 2024.05 | 236B (21B active) | MoE | 标准预训练 + SFT | 128K | DeepSeekMoE + MLA 首次提出 |
| DeepSeek-Coder-V2 | 2024.06 | 236B (21B active) | MoE | 代码预训练 | 128K | 开源代码模型 SOTA |
| DeepSeek-V3 | 2024.12 | 671B (37B active) | MoE | FP8 训练 + 多 Token 预测 | 128K | 训练成本仅 $5.6M，性能比肩 GPT-4.5 |
| DeepSeek-R1 | 2025.01 | 671B (37B active) | MoE | GRPO + 纯强化学习 | 128K | 首个纯 RL 训练的推理模型，开源推理链 |
| DeepSeek-R1-Zero | 2025.01 | 671B (37B active) | MoE | 纯 RL（无 SFT 冷启动） | 128K | 证明纯 RL 可涌现推理能力 |
| DeepSeek-V4 | 2025.06 | 未公开（推测 1T+） | MoE | 增强的 GRPO + 多模态 | 256K | 原生多模态、长上下文、推理能力增强 |
| DeepSeek-R2 | 2025.09 | 未公开 | MoE | 增强的 GRPO | 256K | 推理能力进一步增强，Agent 能力 |

## 核心技术创新

### DeepSeekMoE（混合专家架构）

DeepSeekMoE 是 DeepSeek 对传统 MoE（Mixture of Experts）架构的重大改进，解决了标准 MoE 的两个核心问题：

1. **知识混杂（Knowledge Hybridity）**：标准 MoE 中，不同领域的知识被混杂在同一个专家中，导致专家加载效率低。
2. **知识冗余（Knowledge Redundancy）**：多个专家学习了相似的知识，造成参数浪费。

DeepSeekMoE 的创新：

- **细粒度专家分割（Fine-grained Expert Segmentation）**：将专家进一步切分为更小的粒度，每个专家专注于更窄的知识领域。
- **共享专家隔离（Shared Expert Isolation）**：将一部分专家设为"共享专家"，始终激活，处理通用知识；其余专家为"路由专家"，按需激活。
- **负载均衡优化**：引入辅助损失（Auxiliary Loss）和设备级负载均衡，确保 GPU 之间的计算负载均衡。

### MLA（Multi-head Latent Attention，多头潜在注意力）

MLA 是 DeepSeek 对标准 Multi-Head Attention（MHA）的重大改进，旨在大幅降低 KV cache 的显存占用。

**核心原理**：

标准 MHA 的 KV cache 显存占用为 $O(L \times H \times d_h)$，其中 $L$ 是序列长度，$H$ 是头数，$d_h$ 是每头维度。对于长序列，KV cache 可能占据数百 GB 显存。

MLA 通过低秩压缩（Low-rank Compression）将 KV cache 投影到低维潜在空间：

- **键值压缩**：将 Key 和 Value 投影到远小于原始维度的潜在空间 $d_{latent} \ll H \times d_h$。
- **向上投影**：在注意力计算时，将压缩后的潜在表示向上投影回原始维度。
- **显存节省**：KV cache 的显存占用降低 5-10 倍，使得长上下文推理成为可能。

MLA 的数学形式：

$$c_{KV} = W_{down} \cdot x$$
$$K = W_{up}^K \cdot c_{KV}, \quad V = W_{up}^V \cdot c_{KV}$$

其中 $c_{KV} \in \mathbb{R}^{d_{latent}}$ 是压缩后的潜在表示，$d_{latent}$ 远小于 $H \times d_h$。

### GRPO（Group Relative Policy Optimization，群体相对策略优化）

GRPO 是 DeepSeek 为推理模型训练提出的强化学习算法，是 PPO（Proximal Policy Optimization）的高效替代方案。

**核心原理**：

传统 PPO 需要维护一个与策略模型同等大小的价值模型（Value Model），显存和计算开销巨大。GRPO 通过以下创新消除了对价值模型的需求：

1. **群体采样**：对每个问题采样 $G$ 个不同的输出（Group）。
2. **组内相对奖励**：使用组内奖励的相对排名作为优势函数（Advantage），而非训练价值模型估计。
3. **奖励归一化**：对组内奖励进行 z-score 归一化。

**GRPO 的优势函数**：

$$\hat{A}_{i} = \frac{r_i - \text{mean}(r_{group})}{\text{std}(r_{group})}$$

其中 $r_i$ 是第 $i$ 个输出的奖励，$r_{group}$ 是组内所有输出的奖励。

**GRPO vs PPO 对比**：

| 维度 | PPO | GRPO |
|------|-----|------|
| **价值模型** | 需要 | 不需要 |
| **显存开销** | 2x（策略 + 价值模型） | 1x（仅策略模型） |
| **优势估计** | GAE（广义优势估计） | 组内相对奖励 |
| **训练效率** | 标准 | 更高（减少 50% 显存） |
| **适用任务** | 通用 RLHF | 推理任务（数学、编程） |
| **奖励信号** | 点估计 | 组内相对比较 |

## DeepSeek 对 AI 格局的影响

### 成本革命

DeepSeek-V3 的训练成本仅约 $5.6M（约 4000 万人民币），而同期同等性能的模型训练成本通常在 $50M-$100M。这一成本优势来自：

1. **MoE 架构**：每次推理仅激活 37B 参数，训练效率极高。
2. **FP8 混合精度训练**：业界首个大规模 FP8 训练的模型。
3. **多 Token 预测（MTP）**：同时预测多个未来 token，提高训练效率。
4. **极致工程优化**：自研通信库、优化 GPU 利用率。

### 开源生态

DeepSeek 的开源策略对全球 AI 社区产生了深远影响：

- **开源权重**：所有模型权重开源，允许商业使用。
- **技术报告**：详细公开架构设计和训练方法。
- **社区生态**：HuggingFace 上衍生出大量微调版本和垂直应用。

### 2026年竞争格局

| 维度 | DeepSeek-V4 | GPT-5.5 | Claude 4 | Gemini 3.5 Pro | Llama 4 |
|------|-------------|---------|----------|----------------|---------|
| **开源性** | 开源权重 | 闭源 | 闭源 | 闭源 | 开源权重 |
| **架构** | MoE + MLA | 未公开（推测 MoE） | 未公开 | MoE | MoE |
| **推理能力** | 最强（R1 系列） | 极强 | 极强 | 强 | 强 |
| **多模态** | 原生支持 | 原生支持 | 有限支持 | 原生支持 | 原生支持 |
| **成本** | 极低 | 高 | 高 | 中 | 低 |
| **中文能力** | 最佳 | 优秀 | 优秀 | 优秀 | 良好 |
| **代码能力** | 极强 | 极强 | 极强 | 强 | 优秀 |
| **长上下文** | 256K | 1M | 500K | 2M | 1M |

## 相关笔记

- [[Ch10 LLM 原理与架构演进]]：LLM 架构演进，包括 MoE 和注意力机制
- [[概念-GRPO]]：GRPO（Group Relative Policy Optimization）详细分析
- [[概念-推理模型]]：推理模型（Reasoning Model）的原理与演进
- [[概念-MoE]]：Mixture of Experts 架构详解
- [[概念-RingAttention]]：Ring Attention 与长上下文扩展
- [[概念-SAE]]：稀疏自编码器与可解释性
- [[概念-LLaVA]]：LLaVA 视觉语言模型

## 来源

- DeepSeek 官方: https://www.deepseek.com/
- DeepSeek-V3 技术报告: https://arxiv.org/abs/2412.19437
- DeepSeek-R1 技术报告: https://arxiv.org/abs/2501.12948
- DeepSeek-V2 技术报告: https://arxiv.org/abs/2405.04434
- DeepSeekMoE 论文: https://arxiv.org/abs/2401.06066
- DeepSeek GitHub 组织: https://github.com/deepseek-ai
- HuggingFace DeepSeek 模型集合: https://huggingface.co/deepseek-ai
- GRPO 论文: https://arxiv.org/abs/2402.03300