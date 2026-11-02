---
title: "对比-SFTvsRLHF"
date: 2026-07-01
updated: 2026-07-06
category: "Ch11 模型微调"
tags: ["对比", "微调", "对齐"]
aliases: ["SFT vs RLHF", "监督微调vs人类反馈强化学习"]
prerequisites: "SFT,RLHF,偏好对齐"
source: "笔记/Ch11 模型微调/对比/对比-SFTvsRLHF.md"
---
## 概述

SFT（Supervised Fine-Tuning）和 RLHF（Reinforcement Learning from Human Feedback）是 LLM 训练管线中两个关键阶段，各自解决不同的问题。

## 核心对比

| 维度 | SFT | RLHF |
|------|-----|------|
| 目标 | 教模型"怎么做"——模仿高质量回答的格式与风格 | 教模型"做得好不好"——对齐人类偏好与价值观 |
| 数据格式 | 指令-回答对 (prompt-response pairs) | 偏好对比对 (chosen vs rejected) |
| 核心算法 | 标准交叉熵损失，监督学习 | PPO/DPO/GRPO 等策略优化 |
| 奖励信号 | 直接来自标注数据的 next-token 概率 | 需要奖励模型或偏好信号 |
| 训练流程 | 基座模型 → 在指令数据上微调 | SFT 模型 → 奖励模型训练 → PPO 优化 |
| 计算成本 | 较低，一次前向+反向传播 | 较高，需同时维护策略模型、参考模型、奖励模型（PPO 四模型） |
| 适用阶段 | 训练管线第二步（预训练之后） | 训练管线第三步（SFT 之后） |
| 收敛难度 | 容易收敛，稳定 | 训练不稳定，需调 reward hacking、KL 散度等 |
| 对数据质量要求 | 需要高质量示例 | 偏好标注可容忍一定噪声 |
| 2026 趋势 | 仍是基础步骤，不可跳过 | DPO 等简化方法逐步替代传统 PPO-RLHF |

## 关系与互补

SFT 和 RLHF 并非替代关系，而是管线中的上下游。SFT 让模型学会指令跟随的格式，RLHF 在此基础上注入人类偏好。跳过 SFT 直接做 RLHF 通常效果不佳，因为基座模型尚未掌握对话格式。

## 相关笔记

- [[Ch11 模型微调]] — 微调章节总览
- [[深挖-偏好对齐]] — 偏好对齐机制深度分析
- [[概念-DPO]] — Direct Preference Optimization
- [[概念-RLHF]] — RLHF 完整流程
- [[对比-DPOvsRLHF]] — DPO 与 RLHF 的对比

## 来源

- InstructGPT (Ouyang et al., 2022)
- Training language models to follow instructions with human feedback (NeurIPS 2022)
- OpenAI RLHF 技术报告