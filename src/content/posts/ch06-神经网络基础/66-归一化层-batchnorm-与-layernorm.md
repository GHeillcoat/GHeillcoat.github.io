---
title: "6.6 归一化层：BatchNorm 与 LayerNorm"
description: "神经网络训练中，每一层的输出分布会随着参数更新不断变化——深层网络里，前面层参数的微小变化会被后面层放大，导致训练不稳定。这个现象叫\"内部协变量偏移\"（Internal Covariate Shift）。归一化层的核心思想很简单：把每一层的输出重新拉回均值为0、方差为1的标准分布"
pubDate: 2026-06-30
updatedDate: 2026-07-02
category: "Ch06 神经网络基础"
tags: ["基础", "神经网络"]
aliases: ["归一化层：BatchNorm 与 LayerNorm", "6.6 归一化层-BatchNorm 与 LayerNorm"]
---
神经网络训练中，每一层的输出分布会随着参数更新不断变化——深层网络里，前面层参数的微小变化会被后面层放大，导致训练不稳定。这个现象叫"内部协变量偏移"（Internal Covariate Shift）。归一化层的核心思想很简单：**把每一层的输出重新拉回均值为0、方差为1的标准分布**，让梯度流动更稳定，训练更快。

### 6.6.1 BatchNorm（批归一化）

BatchNorm（2015年由Sergey Ioffe和Christian Szegedy提出）是CNN时代的标配。它在batch维度上做归一化——对同一个batch内的所有样本，计算每个特征的均值和方差，然后归一化。

```
μ_B = (1/m) * Σ x_i          # batch内均值
σ_B^2 = (1/m) * Σ (x_i - μ_B)^2  # batch内方差
x̂_i = (x_i - μ_B) / sqrt(σ_B^2 + ε)  # 归一化
y_i = γ * x̂_i + β            # 缩放和平移（可学习参数）
```

BatchNorm的局限：
- **依赖batch size**：batch太小时，均值和方差的估计不稳定
- **不适用于RNN**：序列长度可变，每个时间步的统计量不同
- **不适用于Transformer的自回归生成**：推理时每次只输入一个token，batch size=1，无法计算batch统计量

### 6.6.2 LayerNorm（层归一化）

[[概念-归一化|LayerNorm]]（2016年由Jimmy Lei Ba等人提出）是BatchNorm的"转置"版本：**不在batch维度上归一化，而是在特征维度上归一化**——对每个样本，独立计算它所有特征的均值和方差。

```
μ = (1/H) * Σ x_j            # 单个样本所有特征的均值
σ^2 = (1/H) * Σ (x_j - μ)^2  # 单个样本所有特征的方差
x̂_j = (x_j - μ) / sqrt(σ^2 + ε)  # 归一化
y_j = γ * x̂_j + β             # 缩放和平移（可学习参数）
```

这也正是[[概念-归一化]]的核心思想——让每个样本的特征分布独立地标准化。

LayerNorm的关键优势：
- **不依赖batch size**：每个样本独立归一化，batch size=1也能正常工作
- **训练和推理一致**：不需要像BatchNorm那样在推理时用训练期累积的全局统计量
- **适用于序列模型**：每个token位置独立归一化，天然适配可变长度序列

### 6.6.3 为什么Transformer必须用LayerNorm

Transformer的每一层都是 `LayerNorm -> Self-Attention -> LayerNorm -> FFN` 的结构。LayerNorm在Transformer中扮演两个关键角色：

1. **稳定自注意力计算**：在计算Q、K、V之前先做LayerNorm，确保输入分布稳定，避免注意力权重过饱和（softmax后全是0或1）
2. **残差连接的健康管理**：Transformer的残差连接（x + Sublayer(x)）要求子层输出的方差不能太大，否则会淹没原始输入。LayerNorm将子层输出限制在合理范围内，让残差连接真正有效

这也是为什么每一篇Transformer论文（从"Attention Is All You Need"到GPT-4、Llama 4）都离不开LayerNorm——它是Transformer稳定训练的基础设施，没有它，几十上百层的Transformer根本训练不起来。

### 6.6.4 BatchNorm vs LayerNorm 对比

| 维度 | BatchNorm | LayerNorm |
|------|-----------|-----------|
| 归一化维度 | Batch维度（跨样本） | 特征维度（每个样本内） |
| 依赖batch size | 是（batch小则不稳定） | 否 |
| 训练/推理一致性 | 不一致（推理用移动平均） | 完全一致 |
| 适用架构 | CNN | Transformer、RNN |
| 提出年份 | 2015 | 2016 |
| 2026年主要场景 | CV模型（ResNet等） | 所有Transformer/LLM |

### 6.6.5 LayerNorm的变体

- **RMSNorm**（Root Mean Square Layer Normalization）：去掉了均值的中心化步骤，只做缩放，计算量约减半。Llama系列全系使用RMSNorm。公式：`y_j = x_j / sqrt(mean(x^2) + ε) * γ`
- **DeepNorm**：专为极深Transformer（1000+层）设计，在LayerNorm后加额外的缩放因子，让训练更稳定
- **Post-LN vs Pre-LN**：原始Transformer把LayerNorm放在子层之后（Post-LN），后来的研究发现放在子层之前（Pre-LN）训练更稳定。2026年所有主流LLM都使用Pre-LN

---

> ← 上一节：[[6.5 常见激活函数深入]] ｜ 下一节：[[6.7 权重初始化]] →
