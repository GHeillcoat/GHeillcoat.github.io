---
title: "Softmax 函数"
description: "Softmax 把任意实数向量变成概率分布——每个元素变成 (0,1) 之间的数，且所有元素之和为 1。它是神经网络从\"打分\"到\"决策\"的桥梁。"
pubDate: 2026-07-01
category: "Ch06 神经网络基础"
tags: ["Softmax", "激活函数", "概率分布", "注意力机制", "深度学习", "温度参数"]
aliases: ["Softmax", "Softmax函数", "温度参数", "Temperature", "LogSoftmax", "Softmax Regression"]
---
## 一句话理解

Softmax 把任意实数向量变成概率分布——每个元素变成 (0,1) 之间的数，且所有元素之和为 1。它是神经网络从"打分"到"决策"的桥梁。

## 零基础理解

考试五道题，每道题你有一个"把握分"：[-2, 0.5, 3, 1, -1]。Softmax 把这些分数变成"你会选这道题的概率"：分数越高的题概率越大，但不会出现负概率或超过 100%。最后你按概率随机选一道题——这就是 LLM 生成下一个 token 的机制。

## 数学定义

给定向量 $\mathbf{z} = [z_1, z_2, \ldots, z_n]$，Softmax 定义为：

$$\text{Softmax}(z_i) = \frac{e^{z_i}}{\sum_{j=1}^{n} e^{z_j}}$$

### 计算示例

输入 $\mathbf{z} = [2.0, 1.0, 0.1]$：

| 步骤 | 值 1 | 值 2 | 值 3 |
|------|------|------|------|
| $z_i$ | 2.0 | 1.0 | 0.1 |
| $e^{z_i}$ | 7.389 | 2.718 | 1.105 |
| 总和 | | 11.212 | |
| Softmax | 0.659 | 0.242 | 0.099 |

结果：[0.659, 0.242, 0.099]，总和 = 1.0。

## 核心性质

| 性质 | 说明 | 重要性 |
|------|------|--------|
| 输出为概率 | 每个元素 $\in (0,1)$，总和 = 1 | 核心功能 |
| 保序性 | 输入越大，输出越大 | 不会改变相对顺序 |
| 平移不变性 | 所有输入加同一个常数，输出不变 | 数值稳定性技巧 |
| 可微 | 处处可导，适合反向传播 | 训练必需 |
| 指数放大 | 指数函数放大差异，让"赢家"更突出 | 接近 argmax 但可微 |

### 平移不变性的重要性

$$\text{Softmax}(z_i + c) = \frac{e^{z_i + c}}{\sum e^{z_j + c}} = \frac{e^c \cdot e^{z_i}}{e^c \cdot \sum e^{z_j}} = \text{Softmax}(z_i)$$

实际实现中，通常减去 $\max(z)$ 防止指数溢出：

$$\text{Softmax}(z_i) = \frac{e^{z_i - \max(z)}}{\sum e^{z_j - \max(z)}}$$

## 温度参数 (Temperature)

Softmax 加温度参数 $\tau > 0$（Temperature）：

$$\text{Softmax}(z_i; \tau) = \frac{e^{z_i / \tau}}{\sum_{j} e^{z_j / \tau}}$$

### 温度对概率分布的影响

| 温度 $\tau$ | 效果 | 分布形态 | 应用场景 |
|-------------|------|---------|---------|
| $\tau \to 0$ | 趋近 one-hot，最大值的概率接近 1 | 极度尖锐 | 确定性推理(greedy) |
| $\tau = 1$ | 标准 Softmax | 原始分布 | 训练阶段 |
| $\tau > 1$ | 分布更均匀，差异缩小 | 更平滑 | 知识蒸馏(Teacher软化标签) |
| $\tau \to \infty$ | 趋近均匀分布 | 完全平坦 | 完全随机 |

### 温度在 LLM 中的应用

```text
低温度 (τ=0.1)：确定性输出，适合代码生成、数学计算
中等温度 (τ=0.7)：平衡创造性和准确性，日常对话
高温度 (τ=1.5)：高创造性，适合头脑风暴、创意写作
```

## Softmax vs Sigmoid

| 维度 | Softmax | Sigmoid |
|------|---------|---------|
| 输入 | 向量 | 标量 |
| 输出 | 概率分布(和为1) | 单个概率(0到1) |
| 分类类型 | 多分类(互斥) | 二分类(独立) |
| 数学关系 | Sigmoid 是 2 类 Softmax 的特例 | $\sigma(x) = \frac{e^x}{e^x + e^0}$ |
| 典型应用 | LLM 输出层、注意力权重 | 二分类输出、门控机制 |

**关键区别**：多分类任务中类别互斥，必须用 Softmax。多标签任务中每个标签独立，用多个 Sigmoid。

## LogSoftmax

$$\text{LogSoftmax}(z_i) = \log(\text{Softmax}(z_i)) = z_i - \log\sum_{j} e^{z_j}$$

| 优势 | 说明 |
|------|------|
| 数值稳定性 | 避免 Softmax 的除法，直接用减法 |
| 与 NLL Loss 配合 | LogSoftmax + NLLLoss = CrossEntropyLoss |
| 梯度更简洁 | 导数形式更简单 |

PyTorch 中 `CrossEntropyLoss` 内部已包含 LogSoftmax，不需要手动加 Softmax。

## Softmax 在注意力机制中的角色

自注意力机制的核心公式：

$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$

Softmax 在这里的作用：

| 步骤 | 操作 | Softmax 的角色 |
|------|------|---------------|
| 1. 计算分数 | $QK^T$ | 得到每个 token 对每个 token 的相关性分数 |
| 2. 缩放 | $/\sqrt{d_k}$ | 防止点积过大导致 Softmax 梯度消失 |
| 3. **Softmax 归一化** | $\text{Softmax}(\cdot)$ | 将分数变成注意力权重(概率分布) |
| 4. 加权求和 | $\times V$ | 用权重聚合 Value |

**为什么需要 $\sqrt{d_k}$**：当 $d_k$ 很大时，点积的方差增长为 $d_k$。Softmax 在输入值很大时梯度趋近于 0（输出接近 one-hot），缩放因子将方差控制为 1。

## 相关笔记

- [[Ch06 神经网络基础]] — Softmax 在神经网络输出层的位置
- [[Ch09 Transformer 架构精讲]] — Softmax 在注意力机制中的计算
- [[概念-注意力机制]] — 注意力权重与 Softmax 的关系
- [[概念-ReLU]] — 隐藏层激活函数 vs 输出层 Softmax
- [[Ch03 AI 需要的数学]] — Softmax 的数学基础

## 来源

- Bridle, "Probabilistic Interpretation of Feedforward Classification Network Outputs" (1990) — 首次提出 Softmax 用于神经网络
- Goodfellow et al., "Deep Learning", Chapter 6.2.2.3 — https://www.deeplearningbook.org/
- Hinton et al., "Distilling the Knowledge in a Neural Network" (2015, 温度参数) — https://arxiv.org/abs/1503.02531
- Vaswani et al., "Attention Is All You Need" (2017) — Softmax 在注意力中 — https://arxiv.org/abs/1706.03762