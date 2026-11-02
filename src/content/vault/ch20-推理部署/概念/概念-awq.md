---
title: "概念-AWQ"
description: "AWQ（Activation-aware Weight Quantization）是一种 4-bit 权重量化方法，通过分析激活值分布来保护重要权重通道，在几乎不损失精度的情况下将模型缩小 4 倍。"
date: 2026-07-06
category: "Ch20 推理部署"
tags: ["量化", "推理", "模型压缩"]
aliases: ["AWQ", "Activation-aware Weight Quantization"]
prerequisites: "概念-模型量化"
source: "笔记/Ch20 推理部署/概念/概念-AWQ.md"
---
## 一句话理解

**AWQ（Activation-aware Weight Quantization）是一种 4-bit 权重量化方法，通过分析激活值分布来保护重要权重通道，在几乎不损失精度的情况下将模型缩小 4 倍。**

## 核心原理

不是所有权重都同等重要。AWQ 的洞察是：**权重的重要性取决于对应激活值的分布**——激活值大的通道，其权重的微小变化会被放大，因此需要更高精度保护。

具体做法：
1. 跑一批校准数据，记录每一层的激活值分布
2. 找到激活值大的"显著通道"（约占 1%）
3. 对这些通道的权重量化前乘以一个缩放因子（>1），量化后再除以它
4. 这样显著通道的量化误差被最小化

## 与其他量化方法对比

| 方法 | 精度 | 速度 | 需要校准数据 | 2026年地位 |
|------|------|------|-------------|-----------|
| AWQ | 4-bit | 快 | 是 | 主流选择 |
| GPTQ | 4-bit | 快 | 是 | 老牌方案 |
| bitsandbytes | 4/8-bit | 中 | 否 | 易用但较慢 |
| GGUF | 2-8 bit | 中 | 否 | llama.cpp 专用 |

## 2026 年地位

AWQ 是 vLLM 默认支持的量化格式之一，适用于 GPU 推理场景。在消费级显卡（RTX 4090 24GB）上，可以跑 70B 模型的 AWQ 量化版。

## 相关笔记

- [[深挖-模型量化]] — 量化技术总览
- [[深挖-量化]] — 量化技术深入
- [[Ch20 模型推理部署]] — 推理部署全景

## 来源

- Lin et al., "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration", 2023, https://arxiv.org/abs/2306.00978