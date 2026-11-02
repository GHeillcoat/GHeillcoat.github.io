---
title: "对比-LoRvsQLoRA"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch11 模型微调"
tags: ["对比", "微调", "量化", "PEFT"]
aliases: ["LoRA vs QLoRA", "低秩适配vs量化低秩适配"]
---
## 概述

LoRA（Low-Rank Adaptation）和 QLoRA（Quantized LoRA）都是参数高效微调（PEFT）方法，QLoRA 在 LoRA 基础上引入量化技术，大幅降低显存需求。

## 核心对比

| 维度 | LoRA | QLoRA |
|------|------|-------|
| 基座模型精度 | FP16 / BF16 | NF4（NormalFloat4）量化到 4-bit |
| 适配器精度 | FP16 / BF16 | BF16（前向时反量化） |
| 显存占用 | 约 2× 基座参数量（16-bit） | 约 0.25× 基座参数量（4-bit），可节省 60-70% |
| 训练速度 | 较快，无量化开销 | 略慢，需反量化操作，约慢 20-30% |
| 效果差异 | 标准基线 | 通常与 LoRA 持平，部分任务略低 0.5-1% |
| 适用 GPU | 需 24-48GB（70B 模型） | 单张 24GB 可微调 70B 模型 |
| 核心技术 | 低秩矩阵分解：W = W₀ + BA | 低秩适配 + NF4 量化 + 双重量化 + 分页优化器 |
| 实现框架 | PEFT / HuggingFace | bitsandbytes + PEFT |
| 适用场景 | GPU 显存充足时，追求最快训练 | 消费级 GPU 微调大模型，降低硬件门槛 |
| 2026 推荐 | 显存富裕时直接使用 | 资源受限时的默认选择，几乎无代价省显存 |

## 关键技术细节

QLoRA 的四个核心技术：
1. **NF4 量化**：基于正态分布信息最优的 4-bit 数据类型
2. **双重量化**：对量化常数再做一次量化，进一步节省 0.4 bit/参数
3. **分页优化器**：将优化器状态卸载到 CPU，避免 OOM
4. **适配器浮点**：LoRA 适配器保持 BF16，前向时动态反量化基座权重

## 相关笔记

- [[深挖-LoRA]] — LoRA 原理与实现
- [[深挖-QLoRA]] — QLoRA 深入分析
- [[深挖-量化]] — 量化技术全景
- [[Ch11 模型微调]] — 微调章节，含 PEFT 方法族
- [[对比-SFTvsRLHF]] — SFT 与 RLHF 对比

## 来源

- LoRA: Low-Rank Adaptation of Large Language Models (Hu et al., ICLR 2022)
- QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al., NeurIPS 2023)
- bitsandbytes 官方文档