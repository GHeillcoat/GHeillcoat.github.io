---
title: "对比-RNNvsTransformer"
date: 2026-07-01
updated: 2026-07-06
category: "Ch08 RNN序列模型"
tags: ["对比", "架构", "RNN", "Transformer", "序列模型"]
aliases: ["RNN vs Transformer", "循环神经网络vsTransformer"]
prerequisites: "RNN,LSTM,Transformer"
source: "笔记/Ch08 RNN序列模型/对比/对比-RNNvsTransformer.md"
---
## 概述

RNN（含 LSTM/GRU）和 Transformer 是处理序列数据的两代架构。Transformer 凭借并行计算和长距离建模能力在 2017 年后逐步取代 RNN 成为 NLP 主导架构。

## 核心对比

| 维度 | RNN (LSTM/GRU) | Transformer |
|------|----------------|-------------|
| 计算方式 | 串行：当前步依赖上一步隐藏状态，无法并行化 | 并行：自注意力一次性计算所有位置 |
| 长距离依赖 | 弱，虽有 LSTM 门控机制，但超长序列仍衰减 | 强，自注意力直接连接任意两个位置，O(1) 路径长度 |
| 训练速度 | 慢，时间步无法并行，GPU 利用率低 | 快，充分利用 GPU 并行计算 |
| 推理速度 | O(1) per token（仅计算当前步） | O(N) per token（需计算所有历史 token 的注意力） |
| 梯度问题 | 梯度消失/爆炸严重，LSTM 缓解但未根治 | 残差连接 + LayerNorm，梯度流动顺畅 |
| 位置编码 | 隐式（通过递归顺序） | 显式，需额外位置编码 |
| 序列长度 | 理论无限，实际受限于 BPTT 截断 | 受限于 O(N²) 的注意力复杂度 |
| 参数效率 | 高，参数共享跨时间步 | 低，每层独立参数 |
| 2026 地位 | 小众：时序预测、实时信号处理、极低延迟场景 | 主流：NLP、CV、多模态、几乎所有 LLM 基座 |
| 代表模型 | LSTM, GRU, DeepAR | GPT, BERT, LLaMA, Claude |

## 为什么 Transformer 胜出

1. **并行训练**：GPU 时代，并行是硬通货。RNN 的串行本质是致命缺陷
2. **长距离建模**：自注意力让任意两个 token 直接交互，无需逐层传递
3. **scaling**：Transformer 随数据/参数规模持续提升，RNN 不遵循此类 scaling law
4. **统一架构**：Transformer 可同时处理文本、图像、音频，实现多模态统一

## RNN 的残留价值

在某些场景下 RNN 仍有优势：
- 极低延迟流式推理（每个 token O(1)）
- 序列长度远超模型上下文窗口时
- 资源极度受限的嵌入式设备

## 相关笔记

- [[Ch08 RNN 与序列模型]] — RNN/LSTM/GRU 章节
- [[Ch09 Transformer 架构精讲]] — Transformer 章节
- [[概念-LSTM]] — 长短期记忆网络详解
- [[对比-CNNvsTransformer]] — CNN 与 Transformer 对比
- [[深挖-状态空间模型]] — Mamba 等新一代序列模型

## 来源

- Attention Is All You Need (Vaswani et al., NeurIPS 2017)
- Long Short-Term Memory (Hochreiter & Schmidhuber, 1997)
- The Annotated Transformer (Harvard NLP)