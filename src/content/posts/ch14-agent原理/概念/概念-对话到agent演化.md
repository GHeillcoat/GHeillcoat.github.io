---
title: "对话到 Agent 演化"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch14 Agent原理"
tags: ["对话", "Agent", "演化", "ReAct", "FunctionCalling", "MultiAgent", "MCP", "A2A"]
aliases: ["Chat到Agent", "对话到Agent", "Chat to Agent Evolution", "对话到 Agent 演化"]
---
## 一句话理解

从一问一答的纯对话，到自主多步执行的 Agent——AI 交互模式经历了六个阶段的演化：纯对话 → ReAct → Function Calling/Tool Use → Multi-Agent → MCP+A2A。这不是一个简单的"升级"过程，而是概念上的逐步丰富：每一步都在前一步的基础上增加了新的能力维度。

**重要提示**：概念演化顺序不等于时间顺序。例如，ReAct 论文（2022年10月）发表于 OpenAI Function Calling API（2023年6月）之前，但在概念上，ReAct 比纯对话更"高级"。

## 六个阶段

### 阶段一：纯对话 (Pure Chat)

**时间**：GPT-3 时代（2020-2022）

**核心能力**：一问一答，模型根据输入文本生成输出文本。

**技术特征**：
- 无状态：每次对话独立，模型不记忆历史
- 无工具：模型只能基于训练数据回答
- 无推理：回答是"直觉式"的，缺乏显式推理过程

**代表实现**：
- GPT-3 Playground
- 早期 ChatGPT (2022年11月)

**核心局限**：
- 无法获取实时信息（训练数据截止）
- 无法执行操作（不能发邮件、查数据库）
- 复杂推理容易出错（没有推理过程）
- 无法进行多步任务

### 阶段二：ReAct (Reasoning + Acting)

**时间**：2022年10月（论文发表）

**核心能力**：模型交替进行推理（Thought）和行动（Action），通过观察（Observation）结果来调整下一步推理。

**技术特征**：
- 显式推理：模型输出 Thought → Action → Observation 的循环
- 工具调用：通过文本解析来使用外部工具（如搜索引擎、计算器）
- 多步执行：可以执行多个 Thought-Action-Observation 循环

**代表实现**：
- ReAct 论文 (Yao et al., 2022)
- LangChain AgentExecutor (2023年初)
- AutoGPT (2023年3月)

**核心局限**：
- 工具调用通过文本解析实现，不可靠
- 依赖 Prompt 工程来约束输出格式
- 没有原生的 Function Calling 支持

### 阶段三：Function Calling / Tool Use

**时间**：2023年6月至今

**核心能力**：模型原生支持 Function Calling，可以可靠地调用预定义的工具函数。

**技术特征**：
- 原生 API：模型直接输出 function_call 对象，而非文本
- JSON Schema：工具参数通过 JSON Schema 定义，类型安全
- 并行调用：支持同时调用多个函数
- 流式调用：在 Streaming 模式下逐步输出参数

**代表实现**：
- OpenAI Function Calling (2023年6月)
- Claude Tool Use (2024年3月)
- Gemini Function Calling (2024年2月)

**核心局限**：
- 各家 API 格式不同，切换成本高
- 单 Agent 调用工具，缺乏多 Agent 协作

### 阶段四：Multi-Agent 协作

**时间**：2024年至今

**核心能力**：多个 Agent 分工协作，每个 Agent 有独立的角色、工具和知识。

**技术特征**：
- 角色分工：每个 Agent 有专门的角色（如研究员、编码员、审核员）
- 任务委派：主 Agent 将子任务分配给专门的 Agent
- 结果聚合：各 Agent 的结果汇总到主 Agent
- 通信机制：Agent 之间通过消息传递协作

**代表实现**：
- CrewAI (2024年)
- AutoGen (Microsoft, 2024年)
- LangGraph (2024年)

**核心局限**：
- Agent 间通信缺乏统一标准
- 各 Agent 的工具调用 API 不统一
- 难以跨平台/跨框架协作

### 阶段五：MCP+A2A 标准化

**时间**：2024年底-2026

**核心能力**：通过 MCP 统一 Agent-工具通信，通过 A2A 统一 Agent-Agent 通信。

**技术特征**：
- MCP：跨模型的工具调用统一协议
- A2A：Agent 间通信的统一协议
- 工具发现：MCP Server 自动暴露可用工具
- Agent 发现：A2A Agent Card 机制

**代表实现**：
- MCP (Anthropic, 2024年11月)
- A2A (Google, 2025年4月)
- MCP+A2A 联合生态 (2026年)

## 概念演化 vs 时间顺序

| 概念演化阶段 | 概念"等级" | 实际时间 | 关键论文/发布 |
|:---|:---|:---|:---|
| 纯对话 | 最基础 | 2020-2022 | GPT-3 (2020) |
| ReAct | 第2级 | 2022年10月 | ReAct 论文 |
| Function Calling | 第3级 | 2023年6月 | OpenAI FC API |
| Multi-Agent | 第4级 | 2024年 | CrewAI, AutoGen |
| MCP+A2A | 第5级 | 2024年底-2026 | MCP, A2A |

**注意**：ReAct 论文（2022年10月）先于 OpenAI Function Calling API（2023年6月）发布。这说明概念演化不等于时间顺序——ReAct 在概念上比纯对话更"高级"，但它出现的时间早于 Function Calling。

## Agent vs 普通 API 调用

| 维度 | 普通 API 调用 | Agent |
|:---|:---|:---|
| 决策者 | 人（开发者预先定义逻辑） | 模型（自主推理和决策） |
| 执行方式 | 固定流程（if-else, 循环） | 动态推理（根据观察调整） |
| 错误处理 | 开发者预先定义 | 自我观察和纠错 |
| 工具使用 | 代码中硬编码 | 动态选择和调用 |
| 任务范围 | 固定的、可预见的 | 开放的、需要推理的 |
| 可扩展性 | 添加新功能需修改代码 | 添加新工具即可扩展 |
| 典型场景 | 查天气 API、发邮件 | 复杂数据分析、多步研究 |

## 演化驱动力

每次演化都由具体的需求驱动：

| 阶段 | 驱动需求 | 解决的问题 |
|:---|:---|:---|
| 纯对话 → ReAct | 模型需要调用外部工具 | 纯对话无法获取实时信息或执行操作 |
| ReAct → FC/Tool Use | 工具调用需要更可靠 | 文本解析不可靠，需要原生 API 支持 |
| FC/Tool Use → Multi-Agent | 复杂任务需要分工 | 单 Agent 难以处理大规模、多领域任务 |
| Multi-Agent → MCP+A2A | 跨平台协作需要标准 | 各家实现不互通，需要统一协议 |

## 相关笔记

- [[概念-纯对话]] - 纯对话模式详解
- [[概念-ReActAgent]] - ReAct Agent 详解
- [[概念-FunctionCalling]] - Function Calling 技术详解
- [[概念-MultiAgent]] - 多 Agent 系统详解
- [[概念-MCP]] - Model Context Protocol 详解
- [[概念-A2A]] - Agent-to-Agent 协议详解
- [[Ch14 Agent 工作原理]] - Agent 工作原理章节
- [[概念-FunctionCalling演化]] - Function Calling 演化

## 来源

- ReAct 论文: https://arxiv.org/abs/2210.03629 (Yao et al., 2022)
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- Anthropic Tool Use: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
- MCP 规范: https://spec.modelcontextprotocol.io/
- A2A 规范: https://a2a.google/
- CrewAI: https://github.com/crewAIInc/crewAI
- AutoGen: https://github.com/microsoft/autogen