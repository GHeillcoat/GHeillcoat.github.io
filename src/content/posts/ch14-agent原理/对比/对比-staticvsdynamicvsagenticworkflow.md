---
title: "对比-StaticvsDynamicvsAgenticWorkflow"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch14 Agent原理"
tags: ["对比", "工作流", "Agent", "编排"]
aliases: ["Static vs Dynamic vs Agentic Workflow", "静态vs动态vs自主工作流"]
---
## 概述

Static、Dynamic 和 Agentic Workflow 是 LLM 应用编排的三种模式，代表了从"完全确定性"到"完全自主"的连续谱。

## 核心对比

| 维度 | Static Workflow | Dynamic Workflow | Agentic Workflow |
|------|-----------------|------------------|------------------|
| 执行路径 | 固定，预定义，无分支 | 条件分支，根据中间结果选择路径 | 模型自主决策，动态生成执行计划 |
| 决策者 | 开发者（编码时决定） | 规则 + LLM 判断（运行时按规则走分支） | LLM 自主（运行时自行规划） |
| 适用场景 | 标准 RAG、固定格式问答、数据清洗管道 | 路由型 RAG、多步骤 QA、需根据输入选策略的任务 | 复杂多步推理、开放域任务、工具编排 |
| 灵活性 | 低，输入变化不改变执行路径 | 中，有限状态机式分支 | 高，模型可随时调整策略 |
| 可控性 | 最高，每一步都可预期 | 中，分支可枚举但有条件 | 最低，模型行为不可完全预测 |
| 成本 | 低，单次推理 | 中，可能多次 LLM 调用 | 高，多次 LLM 调用 + 工具调用 + 反思循环 |
| 调试难度 | 低，路径固定易 trace | 中，分支可追踪 | 高，路径非线性，需复杂 tracing |
| 可靠性 | 高，确定性输出 | 中，规则兜底 | 低，需 guardrails 和 fallback |
| 2026 推荐 | 简单确定性任务 | 中等复杂度 + 需可控性 | 复杂开放任务 + 容忍不确定性 |

## 选型决策树

```
任务复杂度？
├── 简单固定流程 → Static Workflow
│   例：固定格式文档问答
├── 需根据输入选择不同策略 → Dynamic Workflow
│   例：根据问题类型路由到不同知识库
└── 需多步推理+自主工具调用 → Agentic Workflow
    例：数据分析、代码生成与调试、研究助手
```

## 渐进式演进

不要一步到位用 Agentic Workflow。从 Static 开始，逐步引入 Dynamic 分支，最后在必要环节启用 Agentic 自主决策。这种渐进式策略能平衡灵活性与可控性。

## 相关笔记

- [[深挖-工作流模式]] — 三种工作流模式深度分析
- [[概念-StaticWorkflow]] — 静态工作流详解
- [[概念-DynamicWorkflow]] — 动态工作流详解
- [[概念-AgenticWorkflow]] — 自主工作流详解
- [[对比-LangChainvsLangGraph]] — 框架层面的编排对比

## 来源

- Building Effective Agents (Anthropic Research, 2024)
- LangGraph Workflow Patterns (LangChain, 2025)
- The Rise of Agentic Workflows (Andrew Ng, 2024)