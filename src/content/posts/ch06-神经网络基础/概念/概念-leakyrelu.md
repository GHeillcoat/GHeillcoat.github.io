---
title: "Leaky ReLU 与 ReLU 变体家族"
description: "ReLU (Rectified Linear Unit) 是深度学习中最常用的激活函数，但它有一个著名缺陷：\"死亡神经元\" (Dying ReLU) 问题——当神经元输出恒为负值时，梯度永远为 0，该神经元就\"死了\"，再也不会被激活。为了解决这个问题，研究者提出了多种 ReLU "
pubDate: 2026-07-01
category: "Ch06 神经网络基础"
tags: ["概念", "深度学习", "激活函数", "ReLU", "神经网络"]
aliases: ["Leaky ReLU", "PReLU", "ELU", "SELU", "ReLU变体", "LeakyReLU"]
---
## 概述

ReLU (Rectified Linear Unit) 是深度学习中最常用的激活函数，但它有一个著名缺陷：**"死亡神经元" (Dying ReLU)** 问题——当神经元输出恒为负值时，梯度永远为 0，该神经元就"死了"，再也不会被激活。为了解决这个问题，研究者提出了多种 ReLU 变体。

Leaky ReLU and its variants aim to fix the "dying ReLU" problem by allowing a small gradient when the input is negative. Each variant makes different trade-offs between computational efficiency, biological plausibility, and self-normalizing properties.

## ReLU 回顾

### 原始 ReLU

```
f(x) = max(0, x)
f'(x) = 1 if x > 0 else 0
```

**问题**: 当 x < 0 时，梯度为 0，神经元可能永久失活。

## ReLU 变体详解

### 1. Leaky ReLU (2013)

```
f(x) = x if x > 0 else αx  (α 通常 = 0.01)
f'(x) = 1 if x > 0 else α
```

- 负半轴给一个很小的正斜率 α，避免梯度为 0
- α 是手动设定的超参数，通常取 0.01
- 简单有效，计算开销几乎与 ReLU 相同

### 2. PReLU (Parametric ReLU, 2015)

```
f(x) = x if x > 0 else α_i x  (α_i 是可学习参数)
f'(x) = 1 if x > 0 else α_i
```

- 与 Leaky ReLU 形式相同，但 α 不是固定值，而是**通过反向传播学习**的参数
- 每个通道 (Channel) 可以有不同的 α_i
- 在 ImageNet 上首次超越人类水平的 ResNet 中使用了 PReLU
- 额外参数极少 (每个通道一个标量)，几乎不增加过拟合风险

### 3. ELU (Exponential Linear Unit, 2016)

```
f(x) = x if x > 0 else α(e^x - 1)  (α 通常 = 1)
f'(x) = 1 if x > 0 else f(x) + α
```

- 负半轴使用指数函数，使输出均值更接近 0
- 平滑过渡，对噪声更鲁棒
- 负值输出的存在使得激活值的均值向 0 偏移，加速学习
- 缺点：指数运算比 ReLU 稍慢

### 4. SELU (Scaled ELU, 2017)

```
f(x) = λx if x > 0 else λ(αe^x - α)
其中 λ ≈ 1.0507, α ≈ 1.6733 (固定值)
```

- 在 ELU 的基础上乘以一个缩放因子 λ
- 具有**自归一化** (Self-Normalizing) 特性：在特定条件下，网络各层的输出会自动收敛到均值为 0、方差为 1 的分布
- 配合特定的初始化方法 (LeCun Normal) 和 Alpha Dropout 使用
- 是 SNN (Self-Normalizing Neural Networks) 的核心组件

## 五种激活函数对比

| 维度 | ReLU | Leaky ReLU | PReLU | ELU | SELU |
|------|------|------------|-------|-----|------|
| 公式 | max(0, x) | max(αx, x) | max(α_i x, x) | x>0?x:α(e^x-1) | λ·ELU(x) |
| 负半轴 | 0 | 线性 (小斜率) | 线性 (可学习) | 指数衰减 | 缩放指数衰减 |
| 输出范围 | [0, +∞) | (-∞, +∞) | (-∞, +∞) | (-α, +∞) | (-λα, +∞) |
| 输出均值 | > 0 | > 0 (偏小) | > 0 (偏小) | ≈ 0 | ≈ 0 |
| 死亡神经元 | 有 | 无 | 无 | 无 | 无 |
| 可学习参数 | 0 | 0 | 每通道 1 个 | 0 | 0 |
| 计算复杂度 | 极低 | 极低 | 极低 | 中等 (指数) | 中等 (指数) |
| 自归一化 | 否 | 否 | 否 | 部分 | 是 |
| 提出年份 | 2010 | 2013 | 2015 | 2016 | 2017 |

## 死亡神经元问题详解

### 成因

1. **学习率过大**: 权重更新使得某个神经元对所有输入都输出负值
2. **负偏置较大**: 偏置项 b 为负且绝对值很大
3. **梯度更新**: 一旦神经元输出为负，梯度为 0，权重不再更新，神经元永久"死亡"

### 检测方法

- 训练过程中监控各层输出为 0 的神经元比例
- 如果某层超过 40-50% 的神经元死亡，说明存在问题

### 解决方案

1. 使用 Leaky ReLU / PReLU / ELU 替代 ReLU
2. 使用较小的学习率
3. 使用更好的权重初始化 (如 He 初始化)
4. 使用 Batch Normalization 将输入保持在 ReLU 的活跃区间

## 如何选择

| 场景 | 推荐 | 原因 |
|------|------|------|
| 通用分类/回归 | Leaky ReLU | 简单有效，开销最小 |
| 竞赛/追求极致精度 | PReLU | 可学习参数，自适应优化 |
| 深层网络 (50+层) | ELU | 输出均值接近 0，加速收敛 |
| 无 BatchNorm 的深层网络 | SELU | 自归一化，替代 BatchNorm |
| 轻量级/移动端部署 | ReLU 或 Leaky ReLU | 计算量最小 |
| 生成模型 (GAN/VAE) | Leaky ReLU | 防止生成器梯度消失 |

## 2026 年现状

- ReLU 仍是最广泛使用的激活函数
- Leaky ReLU 在很多框架中已成为默认替代
- GELU (Gaussian Error Linear Unit) 在 Transformer 架构中占主导地位
- Swish / SiLU 在某些视觉任务中表现优异
- SELU 在特定架构 (无 BatchNorm 的深层全连接网络) 中仍有应用

## 相关笔记

- [[概念-激活函数]] — 激活函数总览
- [[概念-ReLU]] — 原始 ReLU 详解
- [[概念-梯度消失与梯度爆炸]] — 梯度问题
- [[概念-批归一化]] — Batch Normalization
- [[概念-GELU]] — Transformer 中的激活函数

## 来源

- Maas, A. L., et al. (2013). Rectifier Nonlinearities Improve Neural Network Acoustic Models. ICML. https://ai.stanford.edu/~amaas/papers/relu_hybrid_icml2013_final.pdf
- He, K., et al. (2015). Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet Classification. ICCV. https://arxiv.org/abs/1502.01852
- Clevert, D.-A., et al. (2016). Fast and Accurate Deep Network Learning by Exponential Linear Units (ELUs). ICLR. https://arxiv.org/abs/1511.07289
- Klambauer, G., et al. (2017). Self-Normalizing Neural Networks. NeurIPS. https://arxiv.org/abs/1706.02515