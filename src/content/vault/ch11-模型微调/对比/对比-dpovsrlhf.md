---
title: "对比-DPOvsRLHF"
date: 2026-07-01
updated: 2026-07-06
category: "Ch11 模型微调"
tags: ["对比", "对齐", "偏好优化"]
aliases: ["DPO vs RLHF", "直接偏好优化vs人类反馈强化学习"]
prerequisites: "DPO,RLHF,偏好对齐"
source: "笔记/Ch11 模型微调/对比/对比-DPOvsRLHF.md"
---
## 概述

DPO（Direct Preference Optimization）和 RLHF（Reinforcement Learning from Human Feedback）都是将人类偏好注入 LLM 的方法，但 DPO 通过巧妙的数学重参数化跳过了显式奖励模型训练。

## 核心对比

| 维度 | DPO | RLHF (PPO-based) |
|------|-----|-------------------|
| 是否需要奖励模型 | 不需要，直接从偏好对中学习 | 需要，先训练一个独立的 reward model |
| 训练流程 | 一步：偏好数据 + 参考模型 → 直接优化策略 | 三步：SFT → 训练 RM → PPO 优化策略 |
| 模型数量 | 2 个（策略模型 + 冻结参考模型） | 4 个（策略、参考、奖励、价值模型） |
| 训练稳定性 | 较高，本质是分类损失 | 较低，RL 训练易发散，需大量调参 |
| 计算成本 | 低，一次前向+反向 | 高，需多模型协同，采样开销大 |
| 效果对比 | 在多数 benchmark 上与 RLHF 持平或略优 | 经典方法，经过充分验证 |
| 超参数敏感度 | 低，主要是 β（KL 惩罚系数） | 高，PPO clip、KL 系数、reward normalization 等 |
| 数据效率 | 依赖偏好数据质量，偏好对需覆盖足够 diversity | 奖励模型可泛化到未见 prompt |
| 2026 推荐 | 默认首选，简单有效 | 当偏好数据稀缺但可构建好奖励模型时仍有价值 |

## 数学直觉

DPO 的核心 trick：将 RLHF 中"最大化奖励同时约束 KL 散度"的最优策略表达式代入偏好概率模型，消去奖励函数，直接用偏好对定义损失函数。这使得训练从 RL 问题退化为一个二分类问题。

## 局限性

DPO 依赖偏好数据集中 chosen/rejected 的差异有足够信息量。当偏好对质量参差不齐或存在标注偏差时，DPO 可能学到噪声。RLHF 通过奖励模型可以对数据进行平滑，有一定抗噪能力。

## 相关笔记

- [[深挖-偏好对齐]] — 偏好对齐的数学原理与变体
- [[Ch11 模型微调]] — 微调章节，含 SFT/RLHF/DPO 全景
- [[概念-GRPO]] — Group Relative Policy Optimization
- [[对比-SFTvsRLHF]] — SFT 与 RLHF 的对比
- [[概念-RLHF]] — RLHF 完整流程

## 来源

- Direct Preference Optimization (Rafailov et al., NeurIPS 2023)
- DPO 论文附录中的数学推导
- HuggingFace TRL 库 DPO 实现文档