---
title: "22.3 Agent 框架：选型指南"
date: 2026-06-30
updated: 2026-07-06
category: "Ch22 技术全景"
tags: ["生态", "技术栈", "全景"]
aliases: ["Agent 框架：选型指南", "22.3 Agent 框架-选型指南"]
chapter: "Ch22"
section: "22.3"
source: "笔记/Ch22 技术全景/22.3 Agent 框架-选型指南.md"
---
## 概念

**Agent** 是能自主规划和执行任务流的 AI 程序。普通对话模型是你问一句它答一句的"答题机器"，Agent 则像一个"助理"：接到任务后自己决定先做什么、再做什么、遇到问题调用什么工具、什么时候算完成。

可以把 Agent 想象成一个项目经理。你告诉他"整理上季度销售数据并生成汇报 PPT"，他不会只回你一句话，而是自己拆解任务：先去数据库拉数据 -> 分析趋势 -> 生成图表 -> 排版成 PPT -> 最后把文件发给你。每一步都可能需要调用不同的工具（数据库查询、计算器、文档生成），遇到数据缺失时还会主动询问。Agent 框架就是提供这套"项目经理调度系统"的工具集。^[LangChain Resources, https://langchain.com/resources]

## 教学：主流框架与互操作协议

### 2026 主流 Agent 框架

| 框架 | 厂商 | 定位 | 选型场景 |
|------|------|------|---------|
| LangGraph | LangChain | 生产级工作流编排 | 复杂多步 Agent 管线 |
| CrewAI | 独立 | 角色化多 Agent | 快速原型、团队协作模拟 |
| AutoGen | 微软 | Azure 生态 | Azure 用户、企业场景 |
| OpenAI Agents SDK | OpenAI | GPT 原生集成 | OpenAI 深度用户 |
| Google ADK | Google | Gemini + GCP | Google Cloud 用户 |
| LlamaIndex Workflows | LlamaIndex | 数据密集型 Agent | RAG 为核心的 Agent |

（LangGraph/CrewAI/AutoGen 详见第16章；以上三个同样是 Agent 框架，详见各自官方文档）

选择框架的核心不是"哪个最强"，而是**你的工作流是什么形状**：如果你的 Agent 流程像一条流水线（A -> B -> C -> D），LangGraph 的状态图模型最合适；如果像多个角色开会讨论（设计师 + 程序员 + 测试互相协作），CrewAI 的角色化模式更自然。^[Alice Labs, "Agent Framework Comparison", https://alicelabs.ai]; ^[GuruSup, "AI Agent Frameworks 2026", https://gurusup.com]

2026 年框架选择的一个新趋势是**路由与混合**：不再选一个框架包办一切，而是用 LiteLLM 或 OpenRouter 做智能路由（把小请求分发到便宜模型，复杂请求送到前沿模型），用 MCP 做工具统一接口，让不同框架的 Agent 通过 A2A 协议协作。^[Blockchain.News, "AI Master Stack 2026 Breakdown", https://blockchain.news/ainews/ai-master-stack-2026-breakdown-and-business-guide]

### 互操作协议

2026 年最重要的基础设施创新不在框架本身，而在**让不同框架互通的协议**。就像互联网的价值不在单个网站，而在 HTTP 和 TCP/IP 让所有网站互联互通。^[OpenAgents, https://openagents.org]

- **MCP**（Model Context Protocol，Anthropic 提出）：标准化 Agent 与外部工具的连接方式。相当于 AI 的 "USB-C" -- 不管什么模型、什么工具，只要都支持 MCP，就能即插即用。^[Anthropic, "Introducing MCP", https://www.anthropic.com/news/model-context-protocol]
- **A2A**（Agent-to-Agent，Google 提出）：Agent 之间的通信协议。让不同框架、不同厂商的 Agent 互相对话。相当于给所有 Agent 定了一套"外交语言"，LangGraph 的 Agent 可以委托任务给 CrewAI 的 Agent，反之亦然。^[Google Developers Blog, "Announcing A2A", https://developers.googleblog.com]
- 2026 趋势：MCP + A2A 双协议互补，MCP 管工具、A2A 管协作。两者结合使得 Agent 生态从"各自造轮子"走向"可组装的标准件"。^[Zylos, "MCP+A2A Guide", https://zylos.ai]

## 注意事项

**别把简单自动化叫 Agent。** 2025 年"Agent"这个词被严重滥用。一个按固定脚本调 API 的工作流不是 Agent，就像自动洗衣机不是管家。真正的 Agent 需要在遇到意外情况时自主调整计划 -- 检索结果不足时换关键词重搜，工具调用失败时尝试备用方案，任务目标模糊时主动澄清。如果你的流程是确定性的 A -> B -> C，用普通的工作流引擎就够了，不要引入 Agent 框架的复杂度。

**警惕 Agent 循环的成本陷阱。** Agent 的威力在于自主迭代，但每次迭代都在消耗 Token。一个"先检索 -> 再反思 -> 再检索 -> 再重排序 -> 再生成"的 Agent 流程，Token 消耗可能是单次回答的 5 到 10 倍。2026 年的最佳实践是分级路由：简单查询走快速通道（零 Agent 循环），复杂任务才启动完整的 Agentic 流程。

**MCP 和 A2A 还在早期。** 虽然这两个协议方向正确，但 2026 年它们的实现成熟度参差不齐。不同框架对 MCP 的支持程度不同，A2A 的跨框架互通在实际生产中的测试还不多。如果你现在就要上生产环境，优先选择框架原生的工具集成，把 MCP/A2A 作为未来的迁移方向而非当前依赖。

## 关联

- Agent 协作深入解析：见 [[Ch16 多 Agent 协作|第16章：多 Agent 协作]]
- Agent 驱动的 RAG 流程：见 [[22.5 RAG 技术栈|22.5 RAG 技术栈]]（Agentic RAG）
- Agent 在全栈中的位置：见 [[22.1 全栈架构|22.1 全栈架构]]
- MCP 工具开发：见 [[../Ch20 推理部署/Ch20 模型推理部署|第20章相关工具接口]]

---

> ← 上一节：[[22.2 推理引擎-从云端到边缘]] ｜ 下一节：[[22.4 微调技术-SFT → LoRA → DPO 管线]] →
