---
title: "概念-A2A"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch15 Agent通信协议"
tags: ["AI", "智能体", "协议标准", "Agent间通信", "基础概念", "Google"]
aliases: ["Agent-to-Agent Protocol", "A2A", "A2A", "A2A协议", "Agent间通信协议", "Google A2A"]
---
## 一句话理解

A2A (Agent-to-Agent) 是Google于2025年4月提出的Agent间通信标准协议，让不同框架、不同厂商的Agent能够互相发现、通信和协作。如果说MCP是Agent的USB协议（连工具），A2A就是Agent的电话线（连Agent）。

## 零基础理解

**电话线类比：**

在没有电话之前，两个人要远距离沟通，只能写信或见面。电话出现后，无论你在哪里、用什么电话机，只要拨号就能通话。电话线就是通信的标准化层。

**MCP vs A2A：**

- MCP = Agent连工具：Agent需要查天气，通过MCP连接天气Server
- A2A = Agent连Agent：Agent A需要Agent B的帮助，通过A2A通信

**更具体的场景：**

你有一个"旅行规划Agent"和一个"预算管理Agent"。旅行规划Agent想订机票，但它不擅长算账。它通过A2A协议找到预算管理Agent，说"帮我看看这个机票方案，预算够不够？"预算管理Agent算完后回复"超预算了，建议选便宜点的"。这个过程必须在两个Agent之间完成，这就是A2A的价值。

## 核心概念

### Agent Card（能力声明）

每个Agent通过Agent Card声明自己的能力，就像一张名片：

```json
{
  "name": "Budget Agent",
  "description": "管理旅行预算，提供费用分析和预算建议",
  "url": "https://agents.company.com/budget",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "budget_analysis",
      "name": "预算分析",
      "description": "分析旅行方案的预算合理性"
    },
    {
      "id": "expense_tracking",
      "name": "费用追踪",
      "description": "追踪和分类旅行费用"
    }
  ]
}
```

Agent Card让其他Agent能够：
- **发现**：搜索到所需能力的Agent
- **理解**：知道这个Agent能做什么
- **连接**：获取通信地址和协议版本

### Task（任务对象）

A2A的核心交互单位是Task。一个Task代表一个Agent请求另一个Agent完成的工作：

| Task属性 | 说明 | 示例 |
|----------|------|------|
| id | 任务唯一标识 | "task_abc123" |
| state | 任务状态 | pending → working → completed |
| message | 任务描述和输入 | "分析这个机票方案的预算" |
| artifacts | 任务产出 | 预算分析报告、推荐方案 |
| history | 任务交互历史 | 所有消息和状态变更 |

### 消息流

A2A支持两种消息模式：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| 请求-响应 | Agent A发送请求，Agent B完成返回结果 | 查询、分析、翻译 |
| 流式通信 | Agent B边处理边返回中间结果 | 长时间任务、实时协作 |

### 流式通信

流式通信是A2A的重要特性。对于需要长时间处理的任务，Agent B可以通过SSE（Server-Sent Events）持续发送中间状态，让Agent A实时了解进度：

```
Agent A: "帮我做市场分析"
Agent B: [streaming] "正在搜索数据..." → "正在分析..." → "正在生成报告..." → "完成"
```

## A2A vs MCP 对比

| 维度 | MCP | A2A |
|------|-----|-----|
| 提出方 | Anthropic (2024.11) | Google (2025.04) |
| 管什么 | Agent ↔ 工具 | Agent ↔ Agent |
| 通信方向 | Agent调用工具，工具返回结果 | Agent之间双向通信 |
| 核心概念 | Server、Client、Resources、Tools、Prompts | Agent Card、Task、Message、Artifact |
| 能力发现 | Server注册时声明 | Agent Card声明 |
| 传输层 | STDIO、SSE | HTTP、SSE |
| 流式支持 | 工具调用结果流式返回 | 原生流式通信 |
| 核心场景 | 连接数据源、API、服务 | 多Agent协作、任务委派、Agent间对话 |
| 生态现状 | 数千个MCP Server，多个Client支持 | 框架支持快速增长，Google生态 |
| 协议状态 | 规范稳定，v1.0 | 快速迭代中 |

### 互补关系

MCP和A2A不是竞争关系，而是互补关系。一个完整的Agent系统需要两者：

```
┌─────────────────────────────────────────────────┐
│                   Agent A                        │
│  ┌───────────────────────────────────────────┐  │
│  │              LLM (推理引擎)                │  │
│  └──────┬────────────────────┬───────────────┘  │
│         │  MCP               │  A2A              │
│         ▼                    ▼                   │
│  ┌──────────────┐    ┌──────────────┐           │
│  │  MCP Server  │    │   Agent B    │           │
│  │  (工具/数据)  │    │  (另一个Agent)│           │
│  └──────────────┘    └──────┬───────┘           │
│                             │ MCP                │
│                             ▼                    │
│                      ┌──────────────┐           │
│                      │  MCP Server  │           │
│                      │  (Agent B    │           │
│                      │   的工具)    │           │
│                      └──────────────┘           │
└─────────────────────────────────────────────────┘
```

## 2026年：MCP + A2A形成互补生态

### 生态分工

| 层 | 协议 | 解决的问题 |
|----|------|-----------|
| Agent到工具 | MCP | Agent如何发现和调用外部工具/数据 |
| Agent到Agent | A2A | Agent之间如何发现和协作 |
| Agent到用户 | Chat/UI | Agent如何与用户交互 |

### 实际应用场景

**场景：自动化的软件发布流程**

1. **发布管理Agent**收到"发布v2.0"指令
2. 通过A2A联系**构建Agent**："请构建v2.0版本"
3. **构建Agent**通过MCP调用GitHub、CI/CD工具完成构建
4. 构建完成后，**发布管理Agent**通过A2A联系**测试Agent**："请验证构建结果"
5. **测试Agent**通过MCP调用测试框架、数据库验证
6. 测试通过后，**发布管理Agent**通过A2A联系**通知Agent**："请通知团队"
7. **通知Agent**通过MCP调用Slack/邮件Server发送通知

整个过程涉及多个Agent的A2A通信和多个工具的MCP调用。

## 相关笔记

- [[概念-MCP]] — Agent到工具的标准协议
- [[概念-MCP+A2A]] — 两个协议的互补关系
- [[Ch15 Agent 通信协议]] — Agent通信协议全景
- [[概念-MultiAgent]] — 多Agent系统中的通信需求
- [[Ch16 多 Agent 协作]] — 多Agent协作的深入分析
- [[概念-ReActAgent]] — Agent的推理循环

## 来源

- Google A2A Announcement (2025.04): https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
- A2A Protocol Specification: https://a2a-protocol.org/
- A2A GitHub Repository: https://github.com/google/A2A
- Google Cloud A2A Documentation: https://cloud.google.com/agent-communication-protocol
- MCP + A2A Complementary Analysis: https://modelcontextprotocol.io/docs/concepts/architecture