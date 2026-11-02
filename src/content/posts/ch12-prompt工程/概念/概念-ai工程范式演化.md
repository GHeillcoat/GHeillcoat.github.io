---
title: "AI 工程范式演化"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch12 Prompt工程"
tags: ["AI工程", "范式跃迁", "Prompt工程", "上下文工程", "Harness工程", "Loop工程"]
aliases: ["AI工程范式演化", "AI 工程范式演化", "AI Engineering Paradigm", "四次范式跃迁"]
---
## 一句话理解

AI 工程经历了四次范式跃迁：Prompt 范式（怎么问）→ Context 范式（让模型看见什么）→ Harness 范式（把模型放在什么环境里）→ Loop 范式（让系统自己转起来）。这四次跃迁不是替代关系，而是层叠关系——每一层建立在上一层之上，形成完整的 AI 工程体系。

## 范式总览

| 范式 | 核心问题 | 关键手段 | 代表时间 | 本 Vault 中的实现 |
|:---|:---|:---|:---|:---|
| Prompt 范式 | 怎么问？ | 提示词设计、角色设定、输出格式 | 2022-2023 | Prompt 工程笔记、三种问法 |
| Context 范式 | 让模型看见什么？ | 上下文管理、RAG、信息密度 | 2023-2024 | 漏斗架构、摘要层、渐进式加载 |
| Harness 范式 | 把模型放在什么环境里？ | 文件夹结构、约束、工具协议 | 2024-2025 | WikiLink 约束、Agent.md、MCP |
| Loop 范式 | 让系统自己转起来？ | 自主循环、多步推理、反馈修正 | 2025-2026 | Perceive-Think-Act-Observe 循环 |

## Prompt 范式：怎么问

### 核心思想

AI 工程的第一层：如何设计提示词，让模型给出期望的输出。这是最基础的范式，也是所有其他范式的基础。

### 关键技术

- **角色设定 (Role Prompting)**：给模型设定角色（"你是一个资深架构师"）
- **Few-Shot 示例**：在 Prompt 中提供正确示例，引导模型输出格式
- **Chain-of-Thought (CoT)**：要求模型展示推理过程，提高复杂推理的正确率
- **结构化输出**：要求 JSON、XML 等格式，便于程序解析
- **约束声明**：明确"不要做什么"以及"必须做什么"

### 局限

- 提示词长度有限（早期模型上下文窗口小）
- 提示词无法包含所有领域知识（需要 RAG 补充）
- 模型容易"忘记"提示词中的约束（长对话中）
- 提示词设计高度依赖经验和试错（Prompt Engineering 是"手工艺"）

## Context 范式：让模型看见什么

### 核心思想

Prompt 范式解决了"怎么说"的问题，但 Agent 需要"知道什么"才能做出正确决策。Context 范式关注：在有限的上下文窗口中，如何给模型最有价值的信息。

### 关键技术

- **RAG (Retrieval-Augmented Generation)**：从知识库中检索相关文档，注入上下文
- **信息密度最大化**：在有限的 token 预算中，放入最有信息量的内容
- **漏斗模型**：先展示摘要，让模型决定是否需要全文
- **渐进式加载**：根据对话进展，动态加载更多上下文
- **上下文窗口管理**：长对话中，管理历史消息的保留和裁剪

### 核心突破

Context 范式让 AI 工程从"教模型怎么想"升级为"给模型正确的信息"。正确的信息+正确的提示词，才能产生正确的输出。

## Harness 范式：把模型放在什么环境里

### 核心思想

有了好的提示词和正确的上下文，还需要一个"好的环境"来约束和引导模型的行为。Harness 范式关注：如何设计 Agent 运行的环境，使其行为可预测、可控制。

### 关键技术

- **文件夹结构约束**：用目录结构表达知识层级，模型通过导航文件系统来"理解"知识
- **WikiLink 约束**：用 `[[概念-WikiLink]]` 表达知识间的关联，模型通过追踪链接来"探索"知识图谱
- **工具协议**：MCP 等标准协议约束 Agent 如何调用外部工具
- **Agent.md 配置文件**：用声明式配置定义 Agent 的行为边界和能力
- **沙箱执行**：在隔离环境中执行模型生成的代码，保证安全

### 核心突破

Harness 范式让 AI 从一个"能回答问题"的系统，变成"能在环境中自主行动"的系统。环境提供了边界和规则，让 Agent 的行为可控。

## Loop 范式：让系统自己转起来

### 核心思想

前三层范式解决了"单次交互"的问题，但复杂任务需要多步执行。Loop 范式关注：如何让 Agent 自主地感知、思考、行动、观察，形成闭环。

### 关键技术

- **Perceive-Think-Act-Observe 循环**：Agent 持续感知环境、推理下一步、执行动作、观察结果
- **多步推理 (Multi-step Reasoning)**：Agent 将复杂任务分解为多个步骤，逐步执行
- **自我纠错 (Self-Correction)**：Agent 观察执行结果，发现错误后自动修正
- **记忆管理 (Memory)**：短期记忆（当前对话）+ 长期记忆（持久化知识）
- **反馈循环 (Feedback Loop)**：用户反馈、环境反馈、自我评估反馈

### 核心突破

Loop 范式让 AI 从"一次性回答问题"进化到"持续自主完成任务"。这是 Agent 能力的最高体现。

## 为什么不是替代而是层叠

| 范式 | 依赖的基础 | 为上层提供 |
|:---|:---|:---|
| Prompt 范式 | 无（最底层） | 提示词设计方法 |
| Context 范式 | Prompt 范式 | 信息注入机制 |
| Harness 范式 | Prompt + Context | 环境约束和边界 |
| Loop 范式 | Prompt + Context + Harness | 自主循环能力 |

每一层范式都建立在前面所有层之上。去掉 Prompt 范式，Context 范式的信息注入就失去了目标；去掉 Harness 范式，Loop 范式的自主循环就没有边界和约束。四层范式共同构成了完整的 AI 工程体系。

## 本 Vault 作为四层范式的活体演示

这个 Obsidian Vault 本身就是四层工程范式的完整实现：

- **Prompt 层**：Agent.md 中的提示词纪律、角色设定、输出格式约束
- **Context 层**：摘要.md → 全文的漏斗架构，渐进式加载
- **Harness 层**：文件夹结构、`[[概念-WikiLink]]` 约束、MCP 工具协议
- **Loop 层**：Perceive → Think → Act → Observe 的自主循环

## 相关笔记

- [[Ch12 Prompt 工程]] - Prompt 工程章节
- [[概念-上下文工程]] - 上下文工程详解
- [[概念-Harness工程]] - Harness 工程详解
- [[概念-Loop工程]] - Loop 工程详解
- [[知识图谱]] - 知识图谱
- [[概念-四次范式跃迁]] - 四次范式跃迁原文
- [[概念-四次范式跃迁]] - 四次范式跃迁详解

## 来源

- Anthropic Agent Engineering 博客: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Prompt Engineering Guide: https://www.promptingguide.ai/
- 上下文工程理论: https://blog.langchain.dev/context-engineering/
- MCP 官方规范: https://spec.modelcontextprotocol.io/