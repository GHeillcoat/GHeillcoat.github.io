---
title: "Transformer 架构"
description: "Transformer 是由 Vaswani 等人在 2017 年论文 \"Attention Is All You Need\" 中提出的神经网络架构。它完全基于注意力机制（Attention Mechanism），摒弃了传统的循环（RNN）和卷积（CNN）结构。Transform"
pubDate: 2026-07-01
category: "Ch09 Transformer"
tags: ["Transformer", "深度学习", "注意力机制", "NLP"]
aliases: ["Transformer", "自注意力", "Self-Attention", "Transformer架构"]
---
## 概述

Transformer 是由 Vaswani 等人在 2017 年论文 "Attention Is All You Need" 中提出的神经网络架构。它完全基于注意力机制（Attention Mechanism），摒弃了传统的循环（RNN）和卷积（CNN）结构。Transformer 的提出彻底改变了 NLP 领域，并迅速扩展到 CV、语音、多模态等几乎所有 AI 领域。2026 年，Transformer 已成为 AI 的主导架构，所有主流 LLM（GPT、Claude、Gemini、LLaMA）均基于 Transformer。

## 为什么 Transformer 是革命性的

| 局限 | RNN/LSTM | CNN | Transformer |
|------|----------|-----|-------------|
| 长距离依赖 | 差（梯度消失） | 需要多层堆叠 | 好（直接全局注意力） |
| 并行计算 | 不可以（串行时间步） | 可以（卷积并行） | 可以（注意力并行） |
| 训练速度 | 慢 | 中等 | 快（GPU 友好） |
| 序列建模 | 天然适合 | 需要特殊处理 | 需要位置编码 |
| 可扩展性 | 差 | 好 | 极好（Scaling Law） |

## 核心架构

### 整体结构

Transformer 采用 Encoder-Decoder 结构：

```
Input -> [Input Embedding + Positional Encoding]
              |
              v
         [Encoder x N]
         |  - Multi-Head Self-Attention
         |  - Add & Norm
         |  - Feed Forward Network
         |  - Add & Norm
              |
              v
         [Decoder x N]
         |  - Masked Multi-Head Self-Attention
         |  - Add & Norm
         |  - Cross-Attention (Encoder-Decoder)
         |  - Add & Norm
         |  - Feed Forward Network
         |  - Add & Norm
              |
              v
         [Linear + Softmax] -> Output
```

### 三大注意力机制

| 注意力类型 | 位置 | 功能 | Query 来自 | Key/Value 来自 |
|-----------|------|------|----------|---------------|
| **Self-Attention** | Encoder | 每个 token 关注所有 token（包括自己） | 当前层输入 | 当前层输入 |
| **Masked Self-Attention** | Decoder | 每个 token 只能关注自身及之前的 token | 当前层输入 | 当前层输入 |
| **Cross-Attention** | Decoder | Decoder 关注 Encoder 的输出 | Decoder 当前层 | Encoder 输出 |

### 核心组件详解

#### 1. 缩放点积注意力 (Scaled Dot-Product Attention)

$$ \text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V $$

- $Q$ (Query): 查询向量，表示"我在找什么"
- $K$ (Key): 键向量，表示"我能提供什么"
- $V$ (Value): 值向量，表示"我的实际内容"
- $\sqrt{d_k}$: 缩放因子，防止点积过大导致 softmax 梯度消失

#### 2. 多头注意力 (Multi-Head Attention)

将 Q、K、V 分别投影到 $h$ 个子空间，并行计算注意力，最后拼接：

$$ \text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, ..., \text{head}_h) W^O $$
$$ \text{head}_i = \text{Attention}(QW_i^Q, KW_i^K, VW_i^V) $$

#### 3. 前馈网络 (Feed-Forward Network)

$$ \text{FFN}(x) = \text{GELU}(xW_1 + b_1) W_2 + b_2 $$

或 SwiGLU 变体（LLaMA 使用）：

$$ \text{FFN}(x) = (\text{Swish}(xW_1) \odot xV) W_2 $$

### Transformer 的三大变体

| 变体 | 使用 Encoder | 使用 Decoder | 代表模型 | 典型任务 |
|------|------------|------------|---------|---------|
| **Encoder-Only** | 是 | 否 | BERT, RoBERTa, DeBERTa | 文本理解、分类、NER |
| **Decoder-Only** | 否 | 是（因果自注意力） | GPT, LLaMA, Claude, Gemini | 文本生成、对话 |
| **Encoder-Decoder** | 是 | 是 | T5, BART, 原始 Transformer | 翻译、摘要 |

## 关键设计细节

| 组件 | 作用 | 常见选择 |
|------|------|---------|
| 位置编码 | 注入序列位置信息 | RoPE (LLaMA), Learned (GPT), ALiBi (BLOOM) |
| 激活函数 | 非线性变换 | GELU (BERT/GPT), SwiGLU (LLaMA) |
| 归一化 | 稳定训练 | LayerNorm (BERT), RMSNorm (LLaMA) |
| 归一化位置 | 归一化放在哪里 | Post-Norm (原始), Pre-Norm (现代) |
| 残差连接 | 避免梯度消失 | 所有 Transformer 都使用 |
| Dropout | 正则化 | 训练时使用，推理时关闭 |

## 计算复杂度

对于长度为 $n$、维度为 $d$ 的序列：

| 组件 | 复杂度 | 说明 |
|------|--------|------|
| Self-Attention | $O(n^2 d)$ | 平方复杂度是主要瓶颈 |
| FFN | $O(n d^2)$ | $d$ 通常较大 |
| 总复杂度 | $O(n^2 d + n d^2)$ | 长序列时注意力主导 |

## 2026 年改进方向

1. **高效注意力**：FlashAttention、Ring Attention 实现 O(n) 内存的注意力计算
2. **长上下文**：通过位置编码扩展和稀疏注意力支持 1M+ tokens
3. **MoE (Mixture of Experts)**：稀疏激活，参数规模扩大但计算量可控
4. **替代架构**：Mamba/SSM 等线性复杂度架构在某些场景下挑战 Transformer

## 相关笔记

- [[概念-位置编码]] - 位置编码方案详解
- [[概念-注意力机制]] - 注意力机制原理
- [[概念-KV-Cache]] - Transformer 推理优化
- [[概念-GELU]] - Transformer 的默认激活函数
- [[概念-批归一化]] - LayerNorm/RMSNorm 在 Transformer 中的应用
- [[概念-Mamba]] - Transformer 的替代架构

## 来源

- Vaswani et al. (2017) - "Attention Is All You Need": https://arxiv.org/abs/1706.03762
- Devlin et al. (2019) - "BERT: Pre-training of Deep Bidirectional Transformers": https://arxiv.org/abs/1810.04805
- Brown et al. (2020) - "Language Models are Few-Shot Learners" (GPT-3): https://arxiv.org/abs/2005.14165
- Touvron et al. (2023) - "LLaMA: Open and Efficient Foundation Language Models": https://arxiv.org/abs/2302.13971