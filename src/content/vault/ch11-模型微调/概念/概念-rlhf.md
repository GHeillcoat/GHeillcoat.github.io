---
title: "概念-RLHF"
description: "RLHF（Reinforcement Learning from Human Feedback）是用人类偏好来训练 AI 的方法：先让人类对 AI 的多个回答打分，再训练一个\"奖励模型\"来模拟人类的打分标准，最后用强化学习让 AI 往高分方向优化。"
date: 2026-07-06
category: "Ch11 模型微调"
tags: ["微调", "偏好对齐", "强化学习"]
aliases: ["RLHF", "Reinforcement Learning from Human Feedback", "人类反馈强化学习"]
prerequisites: "概念-SFT"
source: "笔记/Ch11 模型微调/概念/概念-RLHF.md"
---
## 一句话理解

**RLHF（Reinforcement Learning from Human Feedback）是用人类偏好来训练 AI 的方法：先让人类对 AI 的多个回答打分，再训练一个"奖励模型"来模拟人类的打分标准，最后用强化学习让 AI 往高分方向优化。**

## 三步流程

1. **SFT（监督微调）**：用高质量的人类回答数据微调模型，让它学会"好的回答长什么样"
2. **训练奖励模型**：收集人类对多个回答的偏好排序，训练一个模型来预测"人类更喜欢哪个回答"
3. **PPO 强化学习**：用奖励模型给 AI 的回答打分，通过 PPO 算法更新模型，让回答越来越"高分"

**比喻**：教一个厨师做菜。SFT = 给他看菜谱，RLHF = 让他做菜并请人试吃打分，然后根据分数调整配方。

## RLHF 的问题

- **训练不稳定**：PPO 算法对超参数敏感，容易崩溃
- **成本高**：需要维护奖励模型，三步流程复杂
- **奖励篡改**：模型可能学会"骗"奖励模型而不是真正变好

2024 年起，DPO 等简化方法逐渐替代 RLHF。

## 相关笔记

- [[概念-DPO]] — DPO 替代方案
- [[11.5 DPO与偏好对齐]] — 偏好对齐主章节
- [[深挖-偏好对齐]] — 深入技术

## 来源

- Ouyang et al., "Training language models to follow instructions with human feedback", 2022, https://arxiv.org/abs/2203.02155
- Christiano et al., "Deep reinforcement learning from human preferences", 2017, https://arxiv.org/abs/1706.03741