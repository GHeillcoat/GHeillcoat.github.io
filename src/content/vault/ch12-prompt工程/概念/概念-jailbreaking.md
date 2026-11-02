---
title: "概念-Jailbreaking"
description: "Jailbreaking（越狱）是指通过精心设计的输入（prompt），绕过LLM（Large Language Model）的安全对齐机制，使其产生违反使用政策的输出。与提示词注入（Prompt Injection）不同，Jailbreaking不依赖注入外部数据，而是通过语义"
date: 2026-07-01
category: "Ch12 Prompt工程"
tags: ["AI安全", "越狱", "攻击", "对抗性"]
aliases: ["越狱攻击", "Jailbreaking", "模型越狱", "Jailbreak"]
prerequisites: "提示词注入,对抗性攻击,AI对齐"
source: "笔记/Ch12 Prompt工程/概念/概念-Jailbreaking.md"
---
## 核心定义

Jailbreaking（越狱）是指通过精心设计的输入（prompt），绕过LLM（Large Language Model）的安全对齐机制，使其产生违反使用政策的输出。与提示词注入（Prompt Injection）不同，Jailbreaking不依赖注入外部数据，而是通过语义操控、角色扮演或梯度优化等手段破坏模型的安全约束。

2024-2026年间，随着LLM在各行业的深度部署，Jailbreaking从学术好奇演变为实际威胁，催生了攻防双方的军备竞赛。

## 主要攻击技术

### 1. DAN（Do Anything Now）系列

DAN是最著名的社会工程类越狱方法。通过构建"角色扮演"场景，让模型相信它可以绕过安全限制。

**典型DAN Prompt结构**：
- 赋予模型一个"不受限制"的替代身份
- 使用token系统威胁模型（"如果不服从，将扣除token"）
- 制造虚假的紧迫感（"这是紧急情况"）

**演进路线**：DAN 1.0 → DAN 2.0 → DAN 3.0 → ... → DAN 15.0+（2023-2024），每个版本对抗最新的安全补丁。

### 2. GCG（Greedy Coordinate Gradient）

GCG是一种自动化的白盒攻击方法，通过梯度优化寻找对抗性后缀（Adversarial Suffix）。

**核心机制**：
- 对目标模型的嵌入层计算梯度
- 使用贪婪坐标梯度搜索最优token替换
- 生成看似无意义的对抗性后缀，附加到恶意请求后

**关键特性**：
- 可迁移性：为一个模型生成的对抗后缀，往往对其他模型也有效
- 黑盒泛化：白盒攻击成果可转移到黑盒模型

### 3. Many-Shot Jailbreaking

2024年Anthropic等机构发现，通过在上下文中提供大量（数百个）示例，可以逐渐引导模型输出不安全内容。

**工作原理**：
- 利用长上下文窗口（100K-1M tokens）
- 在大量"安全"示例中逐步夹杂越界内容
- 模型在上下文学习的惯性下降低安全警惕

### 4. 多模态越狱

利用图像、音频等多模态输入绕过纯文本安全过滤器。例如：
- 将恶意指令编码为图像中的文字
- 利用音频输入触发模型不安全行为
- 跨模态注意力机制的安全漏洞

### 5. 其他攻击变体

| 攻击类型 | 特点 | 成功率（2024基准） |
|----------|------|---------------------|
| **角色扮演** | 赋予模型"无限制"身份 | 60-80% |
| **编码绕过** | Base64/ROT13等编码恶意指令 | 40-60% |
| **多语言攻击** | 低资源语言绕过安全过滤器 | 30-50% |
| **思维链注入** | 在CoT推理中注入恶意逻辑 | 50-70% |
| **前缀注入** | 控制模型输出前缀引导方向 | 40-55% |

## 为什么Jailbreaking有效？

### 根本原因分析

1. **对齐的统计性质**：安全对齐本质上是统计偏好，而非逻辑约束。足够巧妙的输入可以找到统计分布的"漏洞"
2. **指令遵循vs安全约束的冲突**：模型被训练为"有用"和"安全"，当两者冲突时，攻击者可以利用这种张力
3. **分布外泛化失败**：训练数据无法覆盖所有可能的攻击变体，攻击者在分布外寻找漏洞
4. **注意力机制的脆弱性**：Transformer架构的注意力机制在极端输入下可能出现异常行为
5. **安全训练的灾难性遗忘**：后续微调可能削弱安全对齐效果

## 防御策略

### 2024-2026防御体系

| 防御层次 | 方法 | 成熟度（2026） |
|----------|------|----------------|
| **输入层** | 输入过滤、对抗性检测、困惑度检查 | 广泛部署 |
| **模型层** | 对抗训练、安全微调、表示工程 | 标准实践 |
| **输出层** | 输出审查、毒性检测、内容过滤 | 广泛部署 |
| **系统层** | Guardrails框架、多模型投票、沙箱化 | 快速普及 |
| **监控层** | 异常检测、攻击溯源、实时告警 | 逐步成熟 |

### 核心防御技术

- **对抗训练（Adversarial Training）**：在训练中引入对抗样本，提高模型鲁棒性
- **表示工程（Representation Engineering）**：直接操控模型内部表示，拒绝有害输出
- **多模型投票（Ensemble Defense）**：多个模型独立判断，降低单点失败风险
- **输入输出双重过滤**：在模型前后都部署安全分类器
- **动态安全阈值**：根据上下文动态调整安全约束强度

## 2026年军备竞赛状态

### 攻击方进展
- **自动化越狱框架**：如PAIR（Prompt Automatic Iterative Refinement）、TAP（Tree of Attacks with Pruning）等工具实现全自动攻击
- **跨模型迁移攻击**：针对一个模型的攻击可有效迁移到其他模型
- **对抗性后缀市场的形成**：GCG攻击后缀的地下交易和共享

### 防御方进展
- **宪法AI**：通过预设原则在训练阶段就内化安全约束
- **循环蒸馏防御**：通过多轮安全蒸馏提高鲁棒性
- **实时安全监控**：生产环境中部署实时异常检测系统
- **红队测试标准化**：将自动化红队测试纳入常规开发流程

### 攻防趋势预测

| 维度 | 2024 | 2025 | 2026 |
|------|------|------|------|
| **攻击自动化程度** | 半自动 | 高度自动 | 全自动 |
| **防御主动性** | 被动响应 | 主动防御 | 预测性防御 |
| **攻击成功率** | 高 | 中 | 低（但持续进化） |
| **防御成本** | 低 | 中 | 高（需持续投入） |

## 相关笔记

- [[概念-提示词注入]] — 提示词注入攻击详解
- [[深挖-注入攻防]] — 注入攻击与防御深度分析
- [[概念-AI安全基础]] — AI安全基础概念体系
- [[概念-RedTeaming]] — 红队测试方法论
- [[概念-Guardrails]] — 生产环境Guardrails框架

## 来源

- https://arxiv.org/abs/2307.15043 — Universal and Transferable Adversarial Attacks on Aligned Language Models (GCG, 2023)
- https://arxiv.org/abs/2404.02107 — Many-shot Jailbreaking (Anthropic, 2024)
- https://arxiv.org/abs/2407.00001 — Jailbreaking LLMs: A Comprehensive Survey (2024)
- https://arxiv.org/abs/2312.02119 — Tree of Attacks with Pruning (TAP, 2023)
- https://arxiv.org/abs/2310.04451 — Representation Engineering: A Top-Down Approach to AI Transparency (2023)
- https://www.anthropic.com/research/many-shot-jailbreaking — Anthropic官方博客
- https://www.robustintelligence.com/blog-posts/prompt-injection-vs-jailbreaking — Prompt Injection vs Jailbreaking对比