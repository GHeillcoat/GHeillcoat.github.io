---
title: "Prompt Tuning（软提示微调）"
date: 2026-07-01
updated: 2026-07-06
category: "Ch11 模型微调"
tags: ["微调", "Prompt Tuning", "软提示", "PEFT", "Prompt工程"]
aliases: ["Soft Prompt Tuning", "软提示微调", "Prompt Tuning", "提示微调"]
source: "笔记/Ch11 模型微调/深挖/深挖-PromptTuning.md"
---
## 一句话理解

Prompt Tuning 在输入 Embedding 层前面拼接一组**可训练的虚拟 Token 向量**（软提示，Soft Prompt），模型本身的参数完全冻结。通过优化这些虚拟 Token，让模型在不同任务上表现更好，而无需修改模型内部的任何参数。

## 零基础理解

**不是在改模型，而是在"调教"输入。**

- **硬提示（Hard Prompt）**：你手动写的提示词，比如"请将以下英文翻译成中文："。这是离散的、人类可读的文字。
- **软提示（Soft Prompt）**：一组可训练的连续向量，比如 `[v1, v2, v3, ..., v20]`。这些向量不是任何真实单词的 Embedding，而是"最优的引导信号"——模型看到它们，就知道该做什么。

> 类比：硬提示像是你在餐厅点菜时说"少盐少油"（明确的文字指令）。软提示像是你雇佣了一个专业试吃员，他站在厨房门口，每个菜端出去前他用一种"厨师能懂的眼神"（连续向量）调整一下——你不用说话，效果却更好。

## 核心概念

### 1. 软提示的运作方式

```
输入流程：
[软提示向量] + [真实输入 Token 的 Embedding] → Transformer 模型（冻结）→ 输出

软提示向量（可训练）: [v1, v2, ..., v_n]  ← 只有这部分被优化
模型参数（冻结）: 全部 Transformer 层权重保持不变
```

软提示向量是**连续空间中的点**，不是离散的 Token。它们通过反向传播直接优化，不需要映射到任何真实词汇。

### 2. 软提示 vs 硬提示

| 维度 | 硬提示（Hard Prompt） | 软提示（Soft Prompt） |
|------|---------------------|---------------------|
| 形式 | 自然语言文本（离散 Token） | 连续向量（不可读） |
| 优化方式 | 人工设计、试错 | 梯度下降自动优化 |
| 可解释性 | 高（人类可读） | 低（向量不可理解） |
| 效果 | 依赖人工设计水平 | 通常优于人工设计 |
| 长度 | 几个到几十个 Token | 通常 10-100 个虚拟 Token |
| 存储 | 文本字符串（几乎不占空间） | 向量组（几 KB 到几百 KB） |
| 迁移性 | 可跨模型迁移（文本通用） | 绑定到特定模型（Embedding 空间不同） |
| 修改方式 | 编辑文本 | 重新训练 |

### 3. 提示长度（Prompt Length）

软提示的长度是一个关键超参数：

| 提示长度 | 参数量 | 效果 | 适用场景 |
|---------|--------|------|---------|
| 1-5 | 极少 | 有限 | 极简单任务 |
| 10-20 | 少 | 良好 | 通用推荐，分类任务 |
| 50-100 | 中等 | 优秀 | 生成任务、复杂推理 |
| 100+ | 多 | 可能过拟合 | 大数据量任务 |

**经验法则**：对于分类任务，10-20 个虚拟 Token 通常足够。对于生成任务，需要 50-100 个 Token。超过 100 个 Token 后，收益递减，且可能在小数据集上过拟合。

### 4. 针对不同任务训练不同提示

Prompt Tuning 的最大价值之一：**一个模型 + 多个软提示 = 多任务系统**。

```
基座模型（冻结，16GB）
├── 软提示-翻译（2KB） → 中英翻译
├── 软提示-摘要（2KB） → 文本摘要
├── 软提示-分类（2KB） → 情感分析
├── 软提示-问答（2KB） → 知识问答
└── 软提示-代码（2KB） → 代码生成
```

相比保存 5 个 LoRA adapter（各 50MB），5 个软提示只需要 10KB。但软提示的效果通常不如 LoRA。

## Prompt Tuning vs Prefix Tuning vs P-Tuning 对比

这三种方法名字相似，但机制不同：

| 方法 | 插入位置 | 影响范围 | 参数量 | 效果 | 2026 年状态 |
|------|---------|---------|--------|------|-----------|
| **Prompt Tuning** | 仅输入层 | 间接影响所有层 | 最少 | 中等 | 特定场景使用 |
| **Prefix Tuning** | 每层 Transformer 的 Key/Value | 直接影响每层 | 中等 | 较好 | 基本被 LoRA 取代 |
| **P-Tuning** | 输入层 + 可学习的 Anchor 点 | 间接影响 | 少 | 中等 | 中文 NLP 仍有使用 |
| **P-Tuning v2** | 每层都加（类似 Prefix Tuning） | 直接影响每层 | 中等 | 较好 | 中文 NLP 仍有使用 |

### 核心区别

```
Prompt Tuning:
输入: [v1...v_n] [真实Token] → 只有输入层有软提示

Prefix Tuning:
第1层: [v1...v_n] [真实Token] → 第1层有前缀
第2层: [v1...v_n] [hidden] → 第2层也有前缀
...
第N层: [v1...v_n] [hidden] → 第N层也有前缀

P-Tuning v2:
第1层: [v1...v_n] [真实Token] → 第1层有前缀
第2层: [v1...v_n] [hidden] → 第2层有前缀
...
第N层: [v1...v_n] [hidden] → 第N层有前缀
（与 Prefix Tuning 类似，但用不同的重参数化策略）
```

## 适用场景

| 场景 | 适用性 | 说明 |
|------|--------|------|
| 多任务快速切换 | 极佳 | 软提示最小，切换成本最低 |
| 模型 API 不可修改 | 极佳 | 不需要访问模型内部权重 |
| 分类任务 | 优秀 | 简单分类任务软提示效果很好 |
| 生成任务 | 一般 | 效果不如 LoRA/Prefix Tuning |
| 大型模型（>100B） | 优秀 | 模型越大，Prompt Tuning 效果越好 |
| 小型模型（<1B） | 差 | 小模型容量不足，软提示难以引导 |
| 指令遵循型模型 | 有限 | 模型已内置指令能力，软提示增量有限 |
| Few-shot 场景 | 良好 | 软提示可以隐式编码 few-shot 示例 |

## 局限性

1. **效果不如 LoRA**：在大多数 benchmark 上，Prompt Tuning 的效果只有 LoRA 的 70%-90%。对于需要精确输出的任务（代码生成、数学推理），差距更大。

2. **对小型模型效果差**：原论文发现，Prompt Tuning 在 10B+ 参数的大模型上效果很好，但在 <1B 参数的模型上效果显著下降。小模型没有足够的"容量"来理解和利用软提示。

3. **对指令遵循型模型效果有限**：GPT-5.5、Claude Opus 4.8 等已通过 RLHF/DPO 微调的模型，其内部已经内置了强大的指令遵循能力。额外的软提示只能带来微小的改进。

4. **不可解释**：软提示是一组连续向量，人类无法理解它们"说了什么"。你无法知道软提示让模型做了什么，只能通过最终输出来评估。

5. **跨模型不可迁移**：软提示绑定到特定模型的 Embedding 空间。在 LLaMA 上训练的软提示无法直接用于 Qwen 或 Mistral。

6. **训练不稳定**：软提示的优化空间非常大（连续向量），随机初始化可能导致训练震荡，需要仔细调整学习率。

## 2026 年定位

Prompt Tuning 在 2026 年处于一个**特定但重要**的生态位：

- **API-only 模型微调**：对于 OpenAI、Claude 等只提供 API 的模型，Prompt Tuning 是少数可行的"微调"方式之一（通过 API 的软提示或上下文优化）
- **多任务切换**：在需要极低存储开销的多任务场景中，Prompt Tuning 仍然是最优选择
- **学术研究**：作为理解"模型如何被引导"的研究工具，Prompt Tuning 具有重要价值
- **但主流微调还是 LoRA**：在可以修改模型权重的场景下，LoRA 及其变体是更好的选择

## 相关笔记

- [[深挖-PEFT]] — PEFT 方法总览
- [[深挖-PrefixTuning]] — 前缀微调，每层都加软提示
- [[Ch12 Prompt 工程]] — 硬提示设计与优化
- [[Ch11 模型微调]] — 微调基础知识
- [[深挖-LoRA]] — 主流微调方法，效果优于 Prompt Tuning
- [[深挖-Adapter]] — 另一种不修改原始权重的方法

## 来源

- Lester et al., "The Power of Scale for Parameter-Efficient Prompt Tuning", 2021, https://arxiv.org/abs/2104.08691
- Liu et al., "P-Tuning: Prompt Tuning Can Be Comparable to Fine-tuning Universally Across Scales and Tasks", 2021, https://arxiv.org/abs/2110.07602
- Liu et al., "P-Tuning v2: Prompt Tuning Can Be Comparable to Fine-tuning Universally Across Scales and Tasks", 2022, https://arxiv.org/abs/2110.07602
- Li & Liang, "Prefix-Tuning: Optimizing Continuous Prompts for Generation", 2021, https://arxiv.org/abs/2101.00190
- Google Research, Prompt Tuning Blog, https://ai.googleblog.com/2021/09/the-power-of-scale-for-parameter.html