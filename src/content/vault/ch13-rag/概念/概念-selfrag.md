---
title: "Self-RAG 与 Corrective RAG"
date: 2026-07-01
updated: 2026-07-06
category: "Ch13 RAG"
tags: ["检索增强", "检索增强生成", "Self-RAG", "CRAG", "自主检索"]
aliases: ["Self-Reflective RAG", "自反思检索增强生成", "Corrective Retrieval-Augmented Generation"]
source: "笔记/Ch13 RAG/概念/概念-SelfRAG.md"
---
## 概述

Self-RAG 和 Corrective RAG (CRAG) 代表了 RAG 范式从"被动检索"到"主动反思"的进化。传统的 RAG 系统无条件地对每个查询执行检索，而 Self-RAG 和 CRAG 引入了**检索质量评估**和**自适应检索决策**机制，使系统能够判断何时需要检索、检索结果是否足够好、以及是否需要修正查询重新检索。

这一系列技术在 2023-2024 年间快速发展，到 2026 年已成为生产级 RAG 系统的核心组件。

## Self-RAG：自反思检索增强生成

### 核心思想

Self-RAG (Asai et al., 2023) 通过训练 LLM 生成特殊的**反思标记 (Reflection Tokens)**，使模型在生成过程中自主评估检索质量并决定是否检索。

### 反思标记类型

Self-RAG 定义了以下反思标记：

| 反思标记 | 含义 | 示例 |
|----------|------|------|
| `<Retrieve>` | 需要检索外部知识 | 事实性、知识密集型问题 |
| `<NoRetrieve>` | 不需要检索 | 常识、创意写作、翻译 |
| `<Relevant>` | 检索到的段落与查询相关 | 段落包含所需信息 |
| `<Irrelevant>` | 检索到的段落与查询无关 | 段落主题不匹配 |
| `<FullySupported>` | 生成内容完全被检索结果支持 | 引用了文档中的事实 |
| `<PartiallySupported>` | 生成内容部分被检索结果支持 | 部分信息来自参数知识 |
| `<NoSupport>` | 生成内容不被检索结果支持 | 模型编造了信息 |
| `<Utility>` | 检索结果对生成有用 | 按 1-5 评分 |

### Self-RAG 工作流程

```
用户查询: "What is the GDP of France in 2023?"
    ↓
Step 1: 检索决策
    LLM 生成: <Retrieve>  ← 判断需要检索
    ↓
Step 2: 执行检索
    检索到 K 个段落: [D1, D2, ..., DK]
    ↓
Step 3: 相关性评估
    对每个段落: <Relevant> / <Irrelevant>
    D1: <Relevant>    ← 保留
    D2: <Irrelevant>  ← 丢弃
    D3: <Relevant>    ← 保留
    ↓
Step 4: 基于相关段落生成
    LLM: "France's GDP in 2023 was approximately $3.05 trillion..."
    ↓
Step 5: 支持度评估
    <FullySupported>  ← 生成内容被检索结果验证
    ↓
Step 6: 效用评估
    <Utility: 5>  ← 检索结果对回答很有用
```

### Self-RAG 训练方法

Self-RAG 使用两阶段训练：

1. **Critic 模型训练**：用 GPT-4 等强模型生成带有反思标记的合成数据，然后训练一个 Critic 模型来预测这些标记。
2. **Generator 模型微调**：在 Critic 模型的基础上，对整个 LLM 进行指令微调，使其同时具备生成和反思能力。

## Corrective RAG (CRAG)

### 核心思想

CRAG (Yan et al., 2024) 采用更轻量级的方法：它不要求 LLM 自身具备反思能力，而是引入一个独立的**检索评估器 (Retrieval Evaluator)**，对检索结果进行质量评估，然后触发修正动作。

### CRAG 的检索评估等级

```
检索评估器对检索结果质量的三个等级:

┌─────────────────────────────────────────────────┐
│  Confidence Score: 0.0 ──────────────── 1.0     │
│                                                  │
│  [0.0 ─ 0.3]  Incorrect (低置信度)              │
│       → 触发知识检索 (Knowledge Search)          │
│       → 改写查询，重新检索                       │
│                                                  │
│  [0.3 ─ 0.7]  Ambiguous (中等置信度)             │
│       → 触发知识精炼 (Knowledge Refinement)      │
│       → 对检索结果进行分段、过滤、重排序         │
│                                                  │
│  [0.7 ─ 1.0]  Correct (高置信度)                 │
│       → 直接使用检索结果生成答案                 │
└─────────────────────────────────────────────────┘
```

### CRAG 工作流程

```
用户查询: "What is the latest research on RNA vaccines?"
    ↓
Step 1: 标准检索
    检索到 K 个段落
    ↓
Step 2: 检索评估器 (T5-large 或类似模型)
    评估每个段落的置信度分数
    ↓
Step 3: 根据置信度分流
    ├── Correct (>0.7): 直接传给 LLM 生成
    ├── Ambiguous (0.3-0.7): 过滤+精炼后传给 LLM
    └── Incorrect (<0.3): 触发查询改写 → 重新检索 → 再次评估
    ↓
Step 4: 生成最终答案
    LLM 基于过滤后的相关段落生成答案
```

## Adaptive RAG

Adaptive RAG (Jeong et al., 2024) 是 Self-RAG 和 CRAG 思想的进一步发展，核心特点是**动态选择检索策略**：

| 查询复杂度 | 检索策略 | 说明 |
|-----------|----------|------|
| 简单 (Simple) | 不检索 / 直接回答 | 常识问题、翻译、摘要 |
| 中等 (Moderate) | 单次检索 | 事实性查询，一次检索即可 |
| 复杂 (Complex) | 多步检索 | 需要多跳推理，逐步检索 |
| 高度复杂 (High-Complexity) | 迭代检索+验证 | 需要多次检索、验证、修正 |

Adaptive RAG 使用一个轻量级分类器在查询级别预测复杂度，然后选择合适的检索策略。这个分类器可以从 LLM 的预测中自动生成训练数据。

## Self-RAG vs CRAG vs Adaptive RAG vs 标准 RAG 对比

| 维度 | 标准 RAG | Self-RAG | CRAG | Adaptive RAG |
|------|----------|----------|------|--------------|
| 检索决策 | 总是检索 | LLM 自主决定 | 总是检索 | 分类器预测 |
| 质量评估 | 无 | 反思标记 (LLM 内部) | 独立评估器 (外部) | 分类器+评估器 |
| 查询修正 | 无 | 无 | 有 (知识检索) | 有 (迭代修正) |
| 是否需要训练 | 否 | 需要 (Critic+Generator) | 需要评估器训练 | 需要分类器训练 |
| 延迟 | 低 | 中等 | 中等 | 中-高 |
| 实现复杂度 | 低 | 高 | 中等 | 高 |
| 幻觉减少 | 部分 | 显著 | 显著 | 最优 |
| 检索精度 | 基础 | 高 | 高 | 最高 |
| 代表论文 | Lewis 2020 | Asai 2023 | Yan 2024 | Jeong 2024 |
| 开源实现 | 所有框架 | 需自训练 | 有开源 | 部分开源 |

## 2024-2026 年演进

### 2024 年：技术成熟期

- Self-RAG 和 CRAG 的论文相继发表，引发学术界和工业界广泛关注
- LangChain 和 LlamaIndex 开始集成 CRAG 模式
- 多个开源 CRAG 实现出现（如 langgraph-crag）

### 2025 年：工程化落地

- Agentic RAG 框架 (LangGraph, CrewAI) 将 Self-RAG/CRAG 作为标准 agent 模式
- 轻量级评估器 (如 DeBERTa-v3 微调) 使 CRAG 延迟降至 50ms 以下
- Graph RAG 与 Self-RAG 结合，用于知识图谱增强的检索场景

### 2026 年：标准化

- 反思式检索成为 RAG 系统标配
- 推理模型 (Reasoning Models) 天然具备 Self-RAG 的反思能力，无需额外训练
- 多模态 Self-RAG 出现：对图像、视频检索结果进行质量评估
- 实时 Self-RAG：在流式生成中动态插入检索和验证步骤

## 相关笔记

- [[Ch13 RAG 进化树]] — RAG 技术全景，Self-RAG 和 CRAG 的进化路径
- [[深挖-自主检索RAG]] — 自主检索 RAG 的深入分析
- [[概念-HyDE]] — HyDE 可与 Self-RAG 结合，先 HyDE 后 Self-RAG 评估
- [[概念-推理模型]] — 推理模型的反思能力与 Self-RAG 的天然契合
- [[概念-LLM评估]] — 评估 RAG 系统中检索质量的方法

## 来源

- Asai, A., Wu, Z., Wang, Y., Sil, A., & Hajishirzi, H. (2023). Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection. arXiv:2310.11511. https://arxiv.org/abs/2310.11511
- Yan, S. Q., et al. (2024). Corrective Retrieval Augmented Generation. arXiv:2401.15884. https://arxiv.org/abs/2401.15884
- Jeong, S., et al. (2024). Adaptive-RAG: Learning to Adapt Retrieval-Augmented Large Language Models through Question Complexity. arXiv:2403.14403. https://arxiv.org/abs/2403.14403
- LangGraph CRAG Implementation: https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_crag/
- Self-RAG GitHub Repository: https://github.com/AkariAsai/self-rag