---
title: "概念-DPO"
description: "DPO（Direct Preference Optimization）是一种无需强化学习的对齐方法，直接用人类偏好数据微调模型，比 RLHF 更简单、更稳定。"
date: 2026-07-06
category: "Ch11 模型微调"
tags: ["微调", "偏好对齐", "RLHF"]
aliases: ["DPO", "Direct Preference Optimization", "直接偏好优化"]
prerequisites: "概念-RLHF,概念-SFT"
source: "笔记/Ch11 模型微调/概念/概念-DPO.md"
---
## 一句话理解

**DPO（Direct Preference Optimization）是一种无需强化学习的对齐方法，直接用人类偏好数据微调模型，比 RLHF 更简单、更稳定。**

## 核心原理

RLHF 需要三步：训练奖励模型 → 用 PPO 强化学习优化 → 反复迭代。DPO 把这三步压缩成一步：通过数学变换，将偏好优化问题转化为一个可以直接在偏好数据上做监督学习的损失函数。

**比喻**：RLHF 像请一个评委（奖励模型）来打分，然后根据分数调整表演。DPO 像直接告诉你"这段表演比那段好"，你直接学着往好的方向改进——省去了评委这个中间环节。

## DPO vs RLHF

| 维度 | RLHF | DPO |
|------|------|-----|
| 步骤 | 3 步（奖励模型 + PPO + 迭代） | 1 步（直接优化） |
| 训练稳定性 | 低（PPO 不稳定） | 高（监督学习） |
| 计算成本 | 高 | 中 |
| 需要奖励模型 | 是 | 否 |
| 效果 | 成熟 | 2024 年起接近甚至超越 RLHF |

## 2026 年地位

DPO 已成为偏好对齐的主流方法。变体 ORPO（合并 SFT 和 DPO 为一步）、SimPO（用序列概率替代参考模型）进一步简化了流程。

## 相关笔记

- [[概念-RLHF]] — RLHF 详解
- [[11.5 DPO与偏好对齐]] — 主章节
- [[深挖-偏好对齐]] — 偏好对齐技术深入

## 来源

- Rafailov et al., "Direct Preference Optimization: Your Language Model is Secretly a Reward Model", 2023, https://arxiv.org/abs/2305.18290