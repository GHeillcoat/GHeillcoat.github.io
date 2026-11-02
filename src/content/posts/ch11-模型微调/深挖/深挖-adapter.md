---
title: "Adapter Tuning（适配器微调）"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch11 模型微调"
tags: ["微调", "Adapter", "适配器微调", "PEFT"]
aliases: ["Adapter Tuning", "适配器微调", "Adapter模块", "Adapter"]
---
## 一句话理解

Adapter Tuning 在 Transformer 的每一层之间插入小型神经网络模块（Adapter），微调时只训练这些模块，原始模型参数完全冻结。它是 PEFT 概念的**开创者**，但已被 LoRA 等更高效的方法取代。

## 历史地位

Adapter 是 **PEFT 思想的鼻祖**。2019 年，Houlsby 等人首次提出："我们不需要微调整个模型，只需要在每层之间插入一个小模块，微调这些小模块就够了。" 这个想法在当时是革命性的——它开启了"参数高效微调"这个研究方向。

> 后续的 LoRA、Prefix Tuning、Prompt Tuning 等所有 PEFT 方法，都是对 Adapter 思想的继承和改进。

## 核心概念

### 1. Adapter 的瓶颈结构（Bottleneck Architecture）

Adapter 采用经典的**瓶颈结构**：先将输入维度压缩，通过非线性激活，再扩展回原维度。

```
输入 x (维度 d)
    ↓
LayerNorm
    ↓
↓ 降维投影 (d → b)  ← 瓶颈维度 b << d（通常是 d/4 到 d/64）
    ↓
激活函数（GELU / ReLU）
    ↓
↑ 升维投影 (b → d)  ← 恢复原始维度
    ↓
残差连接 (+ x)      ← 保证初始化时 Adapter 不影响原始输出
    ↓
输出 (维度 d)
```

**关键设计**：
- **瓶颈维度 b**：通常设为 4 ~ 64。b 越小，参数量越少，但容量也越小
- **残差连接**：Adapter 初始化为近似恒等映射（权重接近零），确保训练初期 Adapter 不会破坏预训练模型的行为
- **LayerNorm**：每个 Adapter 前面有一个 LayerNorm，稳定训练

### 2. Adapter 的插入位置

原论文提出了两种插入方案：

| 方案 | 插入位置 | 参数量 | 效果 |
|------|---------|--------|------|
| **Houlsby Adapter** | 每层放 2 个：Attention 后 + FFN 后 | 较多 | 最好 |
| **Pfeiffer Adapter** | 每层放 1 个：FFN 后 | 较少 | 接近 Houlsby |

**Houlsby Adapter**（经典方案）：
```
Transformer 层:
  Multi-Head Attention
  → Adapter #1 → 残差
  → FFN (Feed-Forward Network)
  → Adapter #2 → 残差
```

**Pfeiffer Adapter**（简化方案）：
```
Transformer 层:
  Multi-Head Attention → 残差
  → FFN (Feed-Forward Network)
  → Adapter → 残差
```

### 3. 参数量分析

| 模型大小 | Adapter 瓶颈维度 | 可训练参数 | 占全量微调比例 |
|---------|----------------|----------|--------------|
| BERT-base (110M) | b=64 | ~1.8M | 1.6% |
| BERT-base (110M) | b=16 | ~0.9M | 0.8% |
| BERT-large (340M) | b=64 | ~5.4M | 1.6% |
| GPT-2 (117M) | b=64 | ~1.8M | 1.5% |
| LLaMA-7B | b=64 | ~70M | 1.0% |
| LLaMA-7B | b=16 | ~18M | 0.25% |

## Adapter vs LoRA 对比

这是理解"为什么 Adapter 被取代"的关键对比：

| 维度 | Adapter | LoRA |
|------|---------|------|
| 原理 | 在层之间插入新模块 | 在权重旁加低秩矩阵 |
| 结构 | 瓶颈：降维→激活→升维 | 低秩分解：A × B |
| 推理延迟 | **有额外延迟**（5%-20%） | **无额外延迟**（可合并） |
| 可合并 | 否（串行模块，无法合并） | 是（合并到权重矩阵） |
| 参数量 | 较大（1%-5%） | 极小（0.1%-0.5%） |
| 效果（同参数量） | 较好 | 更好 |
| 训练稳定性 | 良好（残差连接+近零初始化） | 良好 |
| 多任务切换 | 需要保存多个 Adapter 模块 | 切换 LoRA 权重（更小） |
| 2026 年使用率 | 低 | 极高 |

### 为什么 Adapter 增加推理延迟

这是 Adapter 的致命缺陷：

```
LoRA 推理（合并后）：
  X → W' × X → 输出
  计算量：与原始模型完全相同

Adapter 推理：
  X → W × X → Adapter(X) → 输出
  计算量：原始模型 + Adapter（额外 5%-20%）
```

Adapter 是**串行**的——必须等 Adapter 算完才能继续。而 LoRA 可以**合并**到权重矩阵中（W' = W + B×A），推理时和原始模型完全一样。

> 类比：Adapter 像是在高速公路上增加了收费站（串行，必须停车）。LoRA 像是拓宽了车道（合并后，不需要额外操作）。

## 为什么 Adapter 在历史上很重要

尽管 Adapter 已被 LoRA 取代，但它的贡献不可磨灭：

1. **开创了 PEFT 范式**：Adapter 是第一个证明"只训练少量参数也能接近全量微调效果"的方法
2. **瓶颈结构影响了后续架构**：MoE（Mixture of Experts）中的专家路由、Vision Transformer 中的 Adapter 层都借鉴了 Adapter 的瓶颈设计
3. **跨模态迁移**：Adapter 的"即插即用"思想被广泛应用于多模态模型——在一个模态上训练 Adapter，插入到另一个模态的基座模型
4. **多语言 NLP**：Adapter 在多语言 BERT（mBERT）上表现出色，每个语言一个 Adapter，共享一个基座模型

## 2026 年定位

**Adapter 在 LLM 微调领域基本被 LoRA 取代。** 但在以下场景中，Adapter 仍有生命力：

### Adapter 尚存的生态位

| 场景 | 为什么 Adapter 仍有价值 |
|------|----------------------|
| **多语言 NLP** | 每个语言一个 Adapter，共享基座，效果优于 LoRA（历史验证） |
| **跨模态适配** | 视觉→语言、语音→文本的模态桥接，Adapter 的模块化设计更自然 |
| **持续学习** | 新任务加新 Adapter，旧 Adapter 不变，天然适合持续学习 |
| **BERT 系模型** | 对于 Encoder-only 模型（分类、NER），Adapter 仍是主流选择 |
| **学术基线** | 作为 PEFT 研究的"历史基线"，几乎每篇 PEFT 论文都会对比 Adapter |

### 已被取代的场景

| 场景 | 为什么被取代 |
|------|------------|
| **LLM 指令微调** | LoRA 效果更好，推理更快 |
| **生成任务微调** | LoRA 可合并，无推理延迟 |
| **消费级 GPU 微调** | QLoRA 显存更低 |
| **多任务 LLM 服务** | LoRA 切换更快，存储更小 |

## 相关笔记

- [[深挖-LoRA]] — 取代 Adapter 的主流方法，低秩适配
- [[深挖-PEFT]] — PEFT 方法总览，Adapter 是开创者
- [[Ch11 模型微调]] — 微调基础知识
- [[深挖-PrefixTuning]] — 另一种被 LoRA 取代的早期 PEFT 方法
- [[深挖-PromptTuning]] — 与 Adapter 同期发展的软提示方法
- [[Ch09 Transformer 架构精讲]] — 理解 Transformer 层结构

## 来源

- Houlsby et al., "Parameter-Efficient Transfer Learning for NLP (Adapter)", 2019, https://arxiv.org/abs/1902.00751
- Pfeiffer et al., "AdapterFusion: Non-Destructive Task Composition for Transfer Learning", 2021, https://arxiv.org/abs/2005.00247
- Pfeiffer et al., "AdapterHub: A Framework for Adapting Transformers", 2020, https://arxiv.org/abs/2007.07779
- Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models", 2021, https://arxiv.org/abs/2106.09685
- Ruckle et al., "AdapterDrop: On the Efficiency of Adapters in Transformers", 2021, https://arxiv.org/abs/2010.11918
- AdapterHub, https://adapterhub.ml/