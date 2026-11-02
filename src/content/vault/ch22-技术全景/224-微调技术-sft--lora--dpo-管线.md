---
title: "22.4 微调技术：SFT -> LoRA -> DPO 管线"
date: 2026-06-30
updated: 2026-07-06
category: "Ch22 技术全景"
tags: ["生态", "技术栈", "全景"]
aliases: ["微调技术：SFT → LoRA → DPO 管线", "22.4 微调技术-SFT → LoRA → DPO 管线"]
chapter: "Ch22"
section: "22.4"
source: "笔记/Ch22 技术全景/22.4 微调技术-SFT → LoRA → DPO 管线.md"
---
## 概念

基座模型像一个通识教育毕业的大学生 -- 什么都知道一点，但不会写你公司的周报格式，不知道你团队内部的术语，也不理解你希望它用什么语气跟客户说话。**微调**（fine-tuning）就是让这个"大学生"在你的领域里实习几个月，变成符合你要求的专业员工。

2026 年的微调不再是单一操作，而是一条标准化的**三阶段管线**：先教格式（SFT），再降成本（LoRA），最后对口味（DPO/GRPO）。每一步解决一个不同的问题，跳过任何一步都可能让模型"学了但没学会"。^[FutureAGI, "LLM Fine-Tuning Guide 2026", https://futureagi.com/blog/llm-fine-tuning-guide-2025/]

```
SFT（监督微调）→ LoRA/QLoRA（高效适配）→ DPO/GRPO（偏好对齐）→ 模型合并
```

## 教学：三阶段详解

**第一阶段：SFT（Supervised Fine-Tuning，监督微调）。** SFT 做的事情很朴素：给模型看"问题-标准答案"的样例，让它模仿。就像老师给学生的作文提供范文批改 -- "这个问题应该这样回答，那个场景应该用这种格式"。SFT 主要教会模型两件事：输出格式（比如 JSON 结构、Markdown 排版）和领域知识（你们行业的专有术语和流程）。需要 1 万到 10 万个高质量样例，数据质量远比数量重要 -- 1000 个精心标注的样本效果往往好过 10 万个自动生成的噪声数据。^[Sundeep Teki, "SFT, RLHF, DPO, GRPO Guide", https://www.sundeepteki.org/advice/the-complete-guide-to-post-training-llms-how-sft-rlhf-dpo-and-grpo-shape-llms]

**第二阶段：LoRA/QLoRA（高效适配）。** 全量微调一个 700 亿参数的模型需要几十张 A100 显卡，这不是普通团队能承受的。LoRA（Low-Rank Adaptation，低秩适配）的洞察很巧妙：不需要修改全部 700 亿个参数，只需要在原模型旁边插入一些很小的"适配器矩阵"（通常是原参数的 0.1% 到 1%），只训练这些矩阵就能达到接近全量微调的效果。就像在一辆已经造好的车上加装一个后视摄像头，而不是重新设计整辆车。QLoRA 更进一步把基座模型压缩到 4-bit 精度，让一张 24GB 显存的消费级显卡（RTX 4090 就能胜任）也能微调 70B 模型。DoRA 则是对 LoRA 的改进，把增量矩阵拆成方向和大小两部分分别训练，在部分任务上有更好的效果。^[Kensink, "Fine-tuning Methods", https://www.kensink.com/llm/fine-tuning/methods/]

**第三阶段：DPO/GRPO（偏好对齐）。** SFT 只能教模型"正确格式"，不能教它"什么是好回答"。偏好对齐解决的就是这个问题：给模型看同一个问题的好回答和差回答，让它学会区分。DPO（Direct Preference Optimization，直接偏好优化）用一个巧妙的数学公式直接在偏好数据上优化，不需要像 RLHF（人类反馈强化学习）那样先训练一个奖励模型再强化学习，大幅简化了训练流程。GRPO（Group Relative Policy Optimization，分组相对策略优化）则是 DeepSeek-R1 带火的方法：对每个问题生成一组回答，在组内比较优劣来更新策略，特别适合数学和编程这类有客观对错的推理任务 -- 不需要人类标注偏好，程序能自动判断答案对不对。SimPO 和 ORPO 则进一步简化：SimPO 直接用序列概率做偏好对比，ORPO 甚至把指令跟随和偏好对齐合并到一步训练。^[llm-stats.com, "Post-Training in 2026: GRPO, DAPO, RLVR & Beyond", https://llm-stats.com/blog/research/post-training-techniques-2026]; ^[Spheron, "DPO Fine-tuning", https://www.spheron.network/blog/dpo-fine-tuning-gpu-cloud/]

### 主流方法速查

| 方法 | 原理 | 资源需求 |
|------|------|---------|
| SFT | 在指令-回答对上监督学习 | 中等（10K-100K 样本） |
| LoRA | 插入低秩矩阵，只训练增量参数 | 极低（单 GPU 70B） |
| QLoRA | 4-bit 基座 + LoRA | 极低（单 24GB GPU） |
| DPO | 直接从偏好对学习，无需奖励模型 | 低（比 RLHF 简单） |
| DoRA | LoRA 的改进版，分解权重矩阵 | 同 LoRA |

### 2026 新兴方法

| 方法 | 特点 |
|------|------|
| GRPO | DeepSeek-R1 使用，分组对比优化 |
| SimPO/ORPO | 无需参考模型，更简化的偏好优化 |
| 模型合并 | TIES/MergeKit，将多个适配器合并为一个模型 |

### 工具链

- **HuggingFace TRL**：DPO/GRPO 训练库（HuggingFace 官方的对齐训练工具包）^[HuggingFace TRL, https://github.com/huggingface/trl]
- **Unsloth**：2-5 倍加速 LoRA/QLoRA（通过底层 CUDA 优化大幅提速微调）^[Unsloth, https://github.com/unslothai/unsloth]
- **Axolotl**：全功能微调框架（一站式微调工具，支持几乎所有主流方法和模型）^[Axolotl, https://github.com/OpenAccess-AI-Collective/axolotl]
- **DeepSpeed**：分布式训练优化（微软开源的训练加速库，让普通显卡也能训练大模型）

## 注意事项

**SFT 不是万能的。** 一个常见的误区是"模型表现不好就微调"。但实际上，SFT 主要提升的是格式遵循和领域风格适配，对于推理能力的提升非常有限（通常只有 0.5% 到 5%）。如果你需要模型在数学题或代码生成上有质的飞跃，重点应该放在第三阶段的 GRPO 上，而不是堆更多的 SFT 数据。

**数据质量压倒一切。** 微调是"垃圾进垃圾出"的典型。用 1000 个精心打磨的样例微调，效果远超 10 万个自动抓取的低质量对话。投入微调之前，先花时间清洗数据：检查答案是否正确、格式是否统一、是否有前后矛盾的样例。

**微调和 RAG 是互补的，不是替代的。** 一个常见问题是"我应该微调还是做 RAG？" -- 这是一个假对立。RAG 让模型能查外部知识，微调让模型学会更好地利用查到的知识。RAF（Retrieval-Augmented Fine-tuning，检索增强微调）甚至在训练阶段就把检索融入微调流程，让模型在回答时天然会查阅相关文档。2026 年的最佳实践是两者结合：RAG 负责时效性，微调负责风格和深度。^[FutureAGI, "RAG Architecture 2026", https://futureagi.com/blog/rag-architecture-llm-2025/]

## 关联

- 推理引擎层如何高效运行微调后的模型：见 [[22.2 推理引擎-从云端到边缘|22.2 推理引擎]]
- RAG 如何与微调互补：见 [[22.5 RAG 技术栈|22.5 RAG 技术栈]]
- Agent 框架中的模型选择：见 [[22.3 Agent 框架-选型指南|22.3 Agent 框架]]
- 向量数据库和 Embedding 模型：见 [[../Ch13 RAG/Ch13 RAG 进化树|第13章]]
- Agent 开发中的模型配合：见 [[Ch16 多 Agent 协作|第16章]]

---

> ← 上一节：[[22.3 Agent 框架-选型指南]] ｜ 下一节：[[22.5 RAG 技术栈]] →
