---
title: "对比-CNNvsTransformer"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch07 CNN与CV"
tags: ["对比", "架构", "CNN", "Transformer", "计算机视觉"]
aliases: ["CNN vs Transformer", "卷积神经网络vsTransformer"]
---
## 概述

CNN 和 Transformer 是深度学习两大核心架构。CNN 统治计算机视觉近十年，Transformer 自 2020 年 ViT 起全面渗透视觉领域，2026 年两者在各自优势领域并存。

## 核心对比

| 维度 | CNN | Transformer |
|------|-----|-------------|
| 归纳偏置 | 强：平移等变性、局部性——卷积核天然适合图像 | 弱：无内置空间先验，需从数据中学习位置关系 |
| 感受野 | 逐层扩大，需堆叠多层才能获得全局感受野 | 全局自注意力，第一层就拥有全局感受野 |
| 数据需求 | 低-中，ImageNet-1K 即可训练有效模型 | 高，ViT 需 JFT-300M 等大规模数据才能发挥优势 |
| 计算复杂度 | O(k² · C_in · C_out · H · W) per layer | O(N² · d) per layer（N = patch 数量） |
| 小模型效率 | 高，MobileNet/EfficientNet 等轻量级 CNN 在边缘设备极高效 | 较低，小模型 Transformer 通常不如同量级 CNN  |
| 参数效率 | 较高，参数共享（卷积核） | 较低，每个位置独立计算 |
| 多尺度处理 | 天然支持，通过 pooling/stride 逐步降采样 | 需特殊设计（Swin Transformer 的层级结构、PVT 等） |
| 2026 优势领域 | 边缘设备、实时推理、小数据场景、医学影像 | 大模型预训练、多模态、统一架构（图文视频） |
| 代表模型 | ResNet, EfficientNet, ConvNeXt | ViT, Swin Transformer, DINOv2 |

## 融合趋势

2026 年的趋势不是二选一，而是融合：
- **ConvNeXt**：将 Transformer 设计理念（大 kernel、LayerNorm、GELU）引入 CNN
- **Swin Transformer**：将 CNN 的层级结构引入 Transformer
- **混合架构**：早期层用 CNN 提取局部特征，深层用 Transformer 建模全局关系

## 相关笔记

- [[Ch07 CNN 与计算机视觉]] — CNN 章节
- [[Ch09 Transformer 架构精讲]] — Transformer 章节
- [[深挖-ViT]] — Vision Transformer 详解
- [[对比-RNNvsTransformer]] — RNN 与 Transformer 对比
- [[深挖-ConvNeXt]] — CNN 现代化改造

## 来源

- An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale (Dosovitskiy et al., ICLR 2021)
- A ConvNet for the 2020s (Liu et al., CVPR 2022)
- Swin Transformer: Hierarchical Vision Transformer using Shifted Windows (Liu et al., ICCV 2021)