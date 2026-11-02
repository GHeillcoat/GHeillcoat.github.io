---
title: "GRPO (Group Relative Policy Optimization)"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch11 模型微调"
tags: ["GRPO", "偏好对齐", "强化学习", "DeepSeek", "RLHF", "DPO", "推理模型"]
aliases: ["GRPO", "Group Relative Policy Optimization", "分组相对策略优化"]
---
## 一句话理解

DeepSeek-R1使用的对齐方法——对同一个问题生成一组回答,好的奖励差的惩罚,组内相互比较,不需要单独的奖励模型。像"小组内排名"而不是"老师打分"。

## 为什么需要GRPO: RLHF的痛点

### RLHF的核心问题

| 痛点 | 详述 |
|------|------|
| 奖励模型 (Reward Model) | 需要单独训练一个与策略模型同等规模的模型,成本极高 |
| 奖励黑客 (Reward Hacking) | 策略模型找到奖励模型的漏洞,获得高分但输出无意义 |
| 训练不稳定 | PPO需要同时维护4个模型(Policy, Reference, Reward, Value),调参困难 |
| 计算成本高 | 每次PPO迭代需要大量采样和多次模型前向传播 |

### 三种对齐方法的核心思路

**RLHF**: 人类反馈 → 训练奖励模型 → PPO用奖励模型优化策略
**DPO**: 人类偏好数据 → 直接优化策略(隐式奖励)
**GRPO**: 对同一prompt生成多个回答 → 组内比较 → 相对奖励 → 策略优化

## GRPO核心创新: 分组对比替代奖励模型

### GRPO算法流程

```
Step 1: 采样一个prompt
Step 2: 用当前策略生成 G 个不同的回答 {o_1, o_2, ..., o_G}
Step 3: 对每个回答计算"优势"(Advantage):
        - 用规则奖励或外部评分函数给每个回答打分 {r_1, r_2, ..., r_G}
        - 组内归一化: A_i = (r_i - mean(r)) / std(r)
Step 4: 用组内归一化优势更新策略
Step 5: 对下一个prompt重复
```

### 组内归一化的数学直觉

对于一组回答的奖励 $\{r_1, r_2, ..., r_G\}$,GRPO计算组内相对优势:

$$
A_i = \frac{r_i - \text{mean}(\{r_1, ..., r_G\})}{\text{std}(\{r_1, ..., r_G\})}
$$

**直觉**: 
- 高于组内平均的回答获得正优势 → 增强这类回答的概率
- 低于组内平均的回答获得负优势 → 降低这类回答的概率
- 标准化消除了绝对奖励的尺度差异,使训练更稳定

### GRPO的优化目标

$$
\mathcal{L}_{\text{GRPO}} = -\mathbb{E}\left[\min\left(\frac{\pi_\theta(o|q)}{\pi_{\text{old}}(o|q)}A, \text{clip}\left(\frac{\pi_\theta(o|q)}{\pi_{\text{old}}(o|q)}, 1-\epsilon, 1+\epsilon\right)A\right)\right]
$$

这与PPO的形式相同,但优势 $A$ 来自组内相对比较而非一个独立的奖励模型。

## GRPO vs DPO vs RLHF 对比

| 维度 | RLHF (PPO) | DPO | GRPO |
|------|-----------|-----|------|
| 是否需要奖励模型 | 是(需单独训练) | 否(隐式奖励) | 否(组内比较) |
| 是否需要Value模型 | 是(PPO需要) | 否 | 否 |
| 需要维护的模型数 | 4个 | 2个(Policy + Reference) | 2个(Policy + Reference) |
| 训练数据 | 人类偏好比较 | 人类偏好比较 | 任务奖励信号(规则/评分) |
| 奖励信号 | 奖励模型打分 | 隐式(从偏好数据) | 组内相对比较 |
| 奖励黑客风险 | 高 | 中 | 低(无奖励模型可攻击) |
| 训练稳定性 | 低(需精细调参) | 高 | 高 |
| 计算成本 | 最高 | 低 | 中等(需采样多个回答) |
| 推理任务适配 | 一般 | 一般 | 优秀(数学/编程) |
| 代表模型 | GPT-4, Claude | Zephyr, Llama-3 | DeepSeek-R1, DeepSeek-Math |

### 奖励信号来源对比

| 方法 | 奖励信号 | 数学/编程 | 创意写作 | 安全性 |
|------|---------|----------|---------|--------|
| RLHF | 奖励模型 | 可(需要模型) | 可(需要模型) | 可(需要安全性RM) |
| DPO | 偏好数据 | 需标注偏好 | 需标注偏好 | 需标注偏好 |
| GRPO | 规则/评分 | 完美(可自动验证) | 困难(需评分函数) | 需规则设计 |

## GRPO在DeepSeek-R1中的应用

### DeepSeek-R1的奖励设计

| 奖励类型 | 适用任务 | 奖励函数 | 例 |
|---------|---------|---------|-----|
| 准确性奖励 | 数学题 | 最终答案正确 → +1, 错误 → 0 | 2+2=? 回答4 → +1 |
| 格式奖励 | 所有 | 遵循思考格式 → +1 | 用`<think>`标签包裹推理过程 |
| 推理步骤奖励 | 数学/编程 | 中间步骤正确 → +奖励 | 推导步骤中关键步骤正确 |
| 一致性奖励 | 多答案 | 多次采样答案一致 → +奖励 | 多次回答同一问题,答案一致 |

### GRPO在推理能力训练中的优势

| 优势 | 说明 |
|------|------|
| 自我涌现 | 模型在训练中自发学会"思考"和"反思" |
| 可验证任务 | 数学/编程等有明确答案的任务,无需人类标注 |
| 多轮推理 | 支持Chain-of-Thought,模型可以在推理中自我修正 |
| 高效迭代 | 不需要等待人类反馈,训练循环快 |

## 为什么GRPO在2025-2026成为新趋势

| 因素 | 说明 |
|------|------|
| 成本 | 不需要奖励模型,训练成本降低40-60% |
| 稳定性 | 组内归一化使训练更稳定,超参数更鲁棒 |
| 推理能力 | 数学/编程等可验证任务上效果显著优于RLHF |
| 开源生态 | DeepSeek-R1开源,社区可复现和改进 |
| 可扩展性 | 奖励信号来自规则,理论上可以无限扩展数据 |

## 2026年GRPO面临的挑战

| 挑战 | 说明 | 当前解决方向 |
|------|------|------------|
| 主观任务 | 创意写作/对话等无明确答案的任务 | 组合LLM评分 + GRPO |
| 采样成本 | 每个prompt需生成多个回答 | 减少组大小,高效采样 |
| 多样性 | 组内回答可能过于相似 | 提高采样温度,多样化解码 |
| 安全性 | 规则奖励不涵盖安全维度 | 引入安全规则,混合RLHF |

## 相关笔记

- [[深挖-偏好对齐]] — 偏好对齐技术的深度分析
- [[Ch11 模型微调]] — 微调与对齐的完整技术体系
- [[概念-DPO]] — Direct Preference Optimization
- [[概念-RLHF]] — Reinforcement Learning from Human Feedback
- [[对比-DPOvsRLHF]] — DPO与RLHF的系统对比
- [[概念-迁移学习]] — 预训练到对齐的完整流程

## 来源

- Shao et al., "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models" (2024) — https://arxiv.org/abs/2402.03300
- DeepSeek-AI, "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning" (2025) — https://arxiv.org/abs/2501.12948
- Ouyang et al., "Training language models to follow instructions with human feedback" (InstructGPT, 2022) — https://arxiv.org/abs/2203.02155
- Rafailov et al., "Direct Preference Optimization: Your Language Model is Secretly a Reward Model" (2023) — https://arxiv.org/abs/2305.18290
- Schulman et al., "Proximal Policy Optimization Algorithms" (PPO, 2017) — https://arxiv.org/abs/1707.06347