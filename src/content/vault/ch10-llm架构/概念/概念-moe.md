---
title: "MoE 混合专家 (Mixture of Experts)"
description: "MoE 是一种\"众人拾柴火焰高\"的架构——模型包含多个\"专家\"子网络，但每次推理只激活其中一小部分。这让模型参数总量可以极大(万亿级)，但实际计算量只增加很少。"
date: 2026-07-01
category: "Ch10 LLM架构"
tags: ["MoE", "Mixture of Experts", "稀疏激活", "路由门控", "DeepSeek", "Mixtral", "深度学习架构"]
aliases: ["MoE", "Mixture of Experts", "混合专家", "稀疏MoE", "SMoE", "专家路由", "负载均衡", "DeepSeek-MoE"]
prerequisites: "Transformer 基础,神经网络基础,前馈网络"
source: "笔记/Ch10 LLM架构/概念/概念-MoE.md"
---
## 一句话理解

MoE 是一种"众人拾柴火焰高"的架构——模型包含多个"专家"子网络，但每次推理只激活其中一小部分。这让模型参数总量可以极大(万亿级)，但实际计算量只增加很少。

## 零基础理解

一家医院有很多科室(专家)：心内科、骨科、皮肤科。每个病人来了，分诊台(路由)根据症状决定去哪个科室——不需要所有科室的医生都来看这个病人。MoE 做的是同样的事：输入一个 token，路由器决定"这个 token 应该去找哪几个专家处理"，只有被选中的专家才被激活计算。

## 核心架构

### MoE 层替代标准 FFN

在 Transformer 中，MoE 层替换了标准的前馈网络(FFN)：

```text
标准 Transformer 的 FFN:
  output = FFN(x) = W2 · ReLU(W1 · x)

MoE 层的 FFN:
  output = Σ g_i(x) · Expert_i(x)    (i=1..N 个专家)
  
  其中:
  - g_i(x) 是路由器输出的第 i 个专家的权重
  - Expert_i(x) 是第 i 个专家的前馈网络
  - 通常选择 Top-K 个专家，其余专家不计算
```

### 路由门控 (Router / Gate)

```text
Router(x) = Softmax(TopK(x · W_gate))

其中:
- W_gate 是可学习的路由参数矩阵
- TopK 只保留最大的 K 个值，其余置为 0 再 Softmax
- 通常 K=2 (每个 token 发给 2 个专家)
```

路由器的输出决定"这个 token 该去找哪些专家"。

## MoE 的关键设计

### 稀疏激活 (Sparse Activation)

| 对比维度 | 稠密模型 (Dense) | 稀疏 MoE |
|---------|-----------------|---------|
| 每个 token 经过的参数量 | 全部参数 | 只有 Top-K 个专家的参数 |
| 总参数量 | 中等(7B-405B) | 极大(8×7B=56B, 但每个 token 只激活 ~14B) |
| 计算量 (FLOPs) | 与参数量成正比 | 与激活参数量成正比，远小于总参数量 |
| 训练效率 | 每个 token 计算所有参数 | 每个 token 只计算部分参数 |
| 推理效率 | 所有参数常驻内存 | 只需加载激活的专家 |

### 负载均衡 (Load Balancing)

**核心挑战**：如果所有 token 都选择同一个专家，那个专家过载，其他专家闲置——MoE 退化为普通稠密模型。

**解决方案**：

| 策略 | 方法 | 代表模型 |
|------|------|---------|
| 辅助损失 (Auxiliary Loss) | 在训练损失中加一项，惩罚专家负载不均衡 | Switch Transformer, GShard |
| 专家容量 (Expert Capacity) | 限制每个专家最多处理多少 token，超出则丢弃 | GShard |
| 随机路由 | 偶尔随机选择专家，打破路由器的偏好固化 | 多种实现 |
| 负载均衡损失 | Loss = 主任务损失 + λ × (专家使用率的方差) | DeepSeek-V3 |

### Top-K 选择

| K 值 | 效果 | 计算量 | 使用 |
|------|------|--------|------|
| K=1 | 每次只激活 1 个专家 | 最低 | Switch Transformer |
| K=2 | 每次激活 2 个专家 | 适中 | **2026 年主流** (Mixtral, DeepSeek) |
| K>2 | 每次激活多个专家 | 较高 | 特殊场景 |

## 2026 年 MoE 模型格局

| 模型 | 总参数量 | 激活参数量 | 专家数 | Top-K | 发布年份 | 特点 |
|------|---------|-----------|--------|-------|---------|------|
| Switch Transformer | 1.6T | ~30B | 2048 | 1 | 2021 | 首个大模型验证 MoE 有效性 |
| GLaM | 1.2T | ~97B | 64 | 2 | 2021 | Google 的 MoE 语言模型 |
| Mixtral 8×7B | 46.7B | 12.9B | 8 | 2 | 2023 | 开源 MoE 标杆 |
| Mixtral 8×22B | 141B | 39B | 8 | 2 | 2024 | 更大规模开源 MoE |
| DeepSeek-V2 | 236B | 21B | 160 | 6 | 2024 | 细粒度专家 + 共享专家 |
| DeepSeek-V3 | 671B | 37B | 256 | 8 | 2024 | 2024年最强开源模型 |
| Qwen 2.5-MoE | 57B | 14.3B | 64 | 8 | 2025 | 阿里开源 MoE |
| DeepSeek-V4 | ~1.2T | ~60B | 384 | 8 | 2026 | 最新旗舰 MoE |

## MoE 的优势与挑战

### 优势

| 优势 | 说明 |
|------|------|
| 参数效率 | 总参数多但激活参数少，训练成本低于同性能稠密模型 |
| 推理速度 | 激活参数少，推理更快(Mixtral 8×7B 推理速度接近 7B 模型) |
| 专家专业化 | 不同专家自然学会了处理不同类型的问题(代码、数学、文学等) |
| 扩展性 | 增加专家数量即可扩展模型容量，计算量增长远小于参数增长 |

### 挑战

| 挑战 | 说明 | 缓解措施 |
|------|------|---------|
| 负载不均衡 | 某些专家过载，某些闲置 | 辅助损失 + 专家容量 |
| 显存占用 | 所有专家参数需常驻显存 | 专家分片 + 量化 |
| 通信开销 | 专家分布在多 GPU 时，路由需跨卡通信 | 专家并行 + All-to-All 通信 |
| 训练不稳定 | 路由器可能崩溃或模式坍塌 | 辅助损失 + Z-loss 正则化 |
| 微调困难 | MoE 微调比稠密模型更容易过拟合 | 专门的 MoE 微调策略 |

## DeepSeek-MoE 创新

DeepSeek 在 MoE 方面做了两个关键创新：

### 1. 细粒度专家分割 (Fine-grained Expert Segmentation)

传统 MoE 每个专家和标准 FFN 一样大。DeepSeek 把每个专家切成更小的粒度——专家数量更多但每个专家更小，路由更灵活。

### 2. 共享专家 (Shared Experts)

除了路由选择的专家外，还有一组"共享专家"——所有 token 都经过共享专家处理。共享专家负责通用知识，路由专家负责专业化知识。

```text
DeepSeek-MoE 输出 = Σ(路由专家输出) + 共享专家输出
```

## 相关笔记

- [[Ch10 LLM 原理与架构演进]] — MoE 在 LLM 架构中的位置
- [[Ch09 Transformer 架构精讲]] — MoE 替换 Transformer 的 FFN 层
- [[概念-深度学习]] — 稠密模型 vs 稀疏模型的架构选择
- [[概念-注意力机制]] — MoE 与注意力的关系(MoE 替换 FFN 不替换注意力)
- [[概念-Token]] — Token 到专家的路由粒度

## 来源

- Shazeer et al., "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer" (2017) — https://arxiv.org/abs/1701.06538
- Fedus et al., "Switch Transformers: Scaling to Trillion Parameter Models" (2021) — https://arxiv.org/abs/2101.03961
- Jiang et al., "Mixtral of Experts" (2024) — https://arxiv.org/abs/2401.04088
- DeepSeek-AI, "DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model" (2024) — https://arxiv.org/abs/2405.04434
- DeepSeek-AI, "DeepSeek-V3 Technical Report" (2024) — https://arxiv.org/abs/2412.19437
- Du et al., "GLaM: Efficient Scaling of Language Models with Mixture-of-Experts" (2022) — https://arxiv.org/abs/2112.06905