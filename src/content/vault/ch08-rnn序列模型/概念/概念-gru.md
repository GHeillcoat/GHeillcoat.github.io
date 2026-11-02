---
title: "GRU 门控循环单元 (Gated Recurrent Unit)"
description: "GRU 是 LSTM 的简化版——把三个门精简为两个门(更新门+重置门)，去掉细胞状态只保留隐藏状态。参数更少、训练更快，效果经常差不多。"
date: 2026-07-01
category: "Ch08 RNN序列模型"
tags: ["GRU", "Gated Recurrent Unit", "门控循环单元", "RNN", "LSTM", "序列模型"]
aliases: ["GRU", "Gated Recurrent Unit", "门控循环单元", "更新门", "重置门"]
prerequisites: "RNN 基础,LSTM 基础,神经网络基础"
source: "笔记/Ch08 RNN序列模型/概念/概念-GRU.md"
---
## 一句话理解

GRU 是 LSTM 的简化版——把三个门精简为两个门(更新门+重置门)，去掉细胞状态只保留隐藏状态。参数更少、训练更快，效果经常差不多。

## 零基础理解

LSTM 有三个门像一个精密的保险柜(遗忘门、输入门、输出门 + 细胞状态)。GRU 发现：其实两个门就够了——一个门(更新门)同时决定"忘多少旧信息"和"记多少新信息"，另一个门(重置门)决定"过去的信息有多少对当前有用"。更简单，但一样好用。

## 核心架构

### 两个门

```text
GRU 单元内部结构:

输入: x_t (当前输入), h_{t-1} (上一时刻隐藏状态)
输出: h_t (当前隐藏状态)

两个门:
1. 重置门 r_t: 决定忽略多少过去的信息
2. 更新门 z_t: 决定保留多少过去信息 vs 写入多少新信息
```

### 数学公式

| 组件 | 公式 | 激活函数 | 作用 |
|------|------|---------|------|
| 重置门 | $r_t = \sigma(W_r \cdot [h_{t-1}, x_t] + b_r)$ | Sigmoid(0~1) | 0=忽略过去, 1=全部保留 |
| 更新门 | $z_t = \sigma(W_z \cdot [h_{t-1}, x_t] + b_z)$ | Sigmoid(0~1) | 控制新旧信息的混合比例 |
| 候选隐藏状态 | $\tilde{h}_t = \tanh(W_h \cdot [r_t \odot h_{t-1}, x_t] + b_h)$ | Tanh(-1~1) | 新信息候选, 受重置门调控 |
| 隐藏状态更新 | $h_t = (1 - z_t) \odot h_{t-1} + z_t \odot \tilde{h}_t$ | — | 新旧混合 |

## 两个门的直观理解

### 重置门 (Reset Gate)

| 场景 | 重置门输出 | 效果 |
|------|-----------|------|
| 句子结束，开始全新话题 | 接近 0 | 忽略过去，当作第一个词处理 |
| 同一个句子中，前后相关 | 接近 1 | 保留过去信息 |
| 阅读到转折词"但是" | 0.3-0.5 | 部分忽略前面内容 |

**核心作用**：当 $r_t \approx 0$ 时，候选隐藏状态 $\tilde{h}_t$ 就像只看当前输入 $x_t$ 一样，完全忽略历史。这对捕获短期依赖很有用。

### 更新门 (Update Gate)

| 场景 | 更新门输出 | 效果 |
|------|-----------|------|
| 遇到关键信息，需要长期记住 | 接近 0 | $h_t \approx h_{t-1}$，保留旧信息 |
| 遇到新信息，需要更新状态 | 接近 1 | $h_t \approx \tilde{h}_t$，写入新信息 |
| 常规流式处理 | 0.3-0.7 | 平滑混合新旧信息 |

**核心作用**：更新门同时做了 LSTM 中遗忘门和输入门的工作——$z_t$ 控制保留多少旧信息，$1-z_t$ 控制写入多少新信息。两者天然互补，一个门就够了。

## GRU vs LSTM 详细对比

| 维度 | LSTM | GRU |
|------|------|-----|
| 门数量 | 3 (遗忘/输入/输出) | 2 (重置/更新) |
| 状态数量 | 2 (隐藏状态 h + 细胞状态 c) | 1 (隐藏状态 h) |
| 参数量 | 4 × (hidden_size × (hidden_size + input_size)) | 3 × (hidden_size × (hidden_size + input_size)) |
| 相对参数量 | 100% | ~75% |
| 训练速度 | 基准 | 约 15-25% 更快 |
| 内存占用 | 基准 | 约 25% 更少 |
| 长距离依赖 | 很好 | 好(略逊于 LSTM) |
| 短期依赖 | 好 | 好 |
| 梯度消失 | 大幅缓解 | 缓解 |
| 提出年份 | 1997 (Hochreiter & Schmidhuber) | 2014 (Cho et al.) |
| 提出背景 | 解决 RNN 长距离依赖 | 为 Seq2Seq 机器翻译简化 LSTM |

## 什么时候用 GRU 不用 LSTM

| 场景 | 推荐 | 原因 |
|------|------|------|
| 数据量较少 | GRU | 参数少，不容易过拟合 |
| 训练资源有限 | GRU | 训练更快，显存更少 |
| 任务相对简单 | GRU | 简单任务不需要 LSTM 的完整门控 |
| 长序列(>100 步) | LSTM | 细胞状态对长距离依赖更稳定 |
| 需要精确的门控 | LSTM | 三个门各自独立，控制更精细 |
| 计算资源充足 | LSTM | 略好的性能值得额外的计算 |
| 2026 年 NLP | 都不用 | Transformer 已取代两者 |

**经验法则**：如果用小数据集训练 RNN，先试 GRU；如果 GRU 不够好，再试 LSTM。两者效果差异通常不大，但 GRU 收敛更快。

## 门控机制的演化

| 架构 | 年份 | 门 | 状态 | 核心创新 |
|------|------|-----|------|---------|
| 简单 RNN | 1986 | 0 | 1 (h) | 循环连接 |
| LSTM | 1997 | 3 | 2 (h, c) | 门控 + 细胞状态 |
| GRU | 2014 | 2 | 1 (h) | 精简门控，去掉细胞状态 |
| MGU | 2016 | 1 | 1 (h) | 最小门控单元，进一步精简 |
| SRU | 2017 | 2 | 1 (h) | 简化循环计算，加速训练 |
| QRNN | 2018 | 2 | 1 (h) | 卷积 + 门控，比 LSTM 快 16 倍 |

GRU 处于"刚好够用"的甜点——比 LSTM 简单很多，但比简单 RNN 强大很多。

## 2026 年 GRU 的地位

GRU 和 LSTM 一样，在 NLP 主流领域已被 Transformer 取代。但 GRU 因其简洁高效，在以下场景仍有一席之地：

| 领域 | 使用情况 |
|------|---------|
| 嵌入式设备 | 参数量少，适合 MCU/边缘设备 |
| 实时系统 | 推理速度快，延迟低 |
| 小数据时间序列 | 参数少不容易过拟合 |
| 强化学习 | 作为策略网络的序列编码器 |
| 教学 | 比 LSTM 更容易理解和实现 |

## 相关笔记

- [[概念-LSTM]] — GRU 的来源和对比对象
- [[Ch08 RNN 与序列模型]] — RNN 家族在序列模型中的位置
- [[概念-反向传播]] — 门控机制如何影响梯度流动
- [[Ch09 Transformer 架构精讲]] — Transformer 如何取代 RNN 家族
- [[概念-注意力机制]] — 注意力机制 vs 门控机制的对比

## 来源

- Cho et al., "Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation" (2014) — https://arxiv.org/abs/1406.1078
- Chung et al., "Empirical Evaluation of Gated Recurrent Neural Networks on Sequence Modeling" (2014) — GRU vs LSTM 全面对比 — https://arxiv.org/abs/1412.3555
- Jozefowicz et al., "An Empirical Exploration of Recurrent Network Architectures" (2015) — 大规模 RNN 架构搜索 — https://proceedings.mlr.press/v37/jozefowicz15.html
- Olah, "Understanding LSTM Networks" (2015, 同样解释 GRU) — https://colah.github.io/posts/2015-08-Understanding-LSTMs/